
-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'finance', 'legal', 'commercial', 'viewer', 'none');

-- Create contract status enum
CREATE TYPE public.contract_status AS ENUM ('active', 'expired', 'cancelled');

-- Create subscription status enum
CREATE TYPE public.subscription_status AS ENUM ('active', 'inactive', 'past_due');

-- Create plan enum
CREATE TYPE public.plan_type AS ENUM ('basic', 'pro', 'enterprise');

-- Create provider enum
CREATE TYPE public.integration_provider AS ENUM ('docusign', 'adobe_sign', 'clicksign', 'd4sign');

-- Companies table
CREATE TABLE public.companies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- Profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  role public.app_role NOT NULL DEFAULT 'none',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Folders table
CREATE TABLE public.folders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  parent_id UUID REFERENCES public.folders(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;

-- Contracts table
CREATE TABLE public.contracts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  folder_id UUID REFERENCES public.folders(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  supplier TEXT,
  value NUMERIC,
  category TEXT,
  status public.contract_status NOT NULL DEFAULT 'active',
  signature_date DATE,
  expiration_date DATE,
  file_url TEXT,
  created_by UUID REFERENCES auth.users(id),
  ai_extracted_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

-- Folder permissions table
CREATE TABLE public.folder_permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  folder_id UUID NOT NULL REFERENCES public.folders(id) ON DELETE CASCADE,
  can_read BOOLEAN NOT NULL DEFAULT false,
  can_write BOOLEAN NOT NULL DEFAULT false,
  UNIQUE(company_id, role, folder_id)
);
ALTER TABLE public.folder_permissions ENABLE ROW LEVEL SECURITY;

-- Integrations table
CREATE TABLE public.integrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  provider public.integration_provider NOT NULL,
  api_key TEXT,
  api_secret TEXT,
  email_login TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;

-- Subscriptions table
CREATE TABLE public.subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  status public.subscription_status NOT NULL DEFAULT 'active',
  plan public.plan_type NOT NULL DEFAULT 'basic',
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  current_period_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Storage bucket for contract files
INSERT INTO storage.buckets (id, name, public) VALUES ('contracts', 'contracts', false);

-- Helper function: get user's company_id
CREATE OR REPLACE FUNCTION public.get_user_company_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id FROM public.profiles WHERE id = auth.uid()
$$;

-- Helper function: get user's role
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS public.app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid()
$$;

-- Helper function: check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role = 'admin' FROM public.profiles WHERE id = auth.uid()
$$;

-- Helper function: check folder permission
CREATE OR REPLACE FUNCTION public.has_folder_permission(_folder_id UUID, _permission TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.folder_permissions fp
    JOIN public.profiles p ON p.company_id = fp.company_id AND p.role = fp.role
    WHERE p.id = auth.uid()
      AND fp.folder_id = _folder_id
      AND CASE WHEN _permission = 'read' THEN fp.can_read ELSE fp.can_write END
  )
$$;

-- RLS: Companies
CREATE POLICY "Users see own company" ON public.companies
  FOR SELECT USING (id = public.get_user_company_id());

-- RLS: Profiles
CREATE POLICY "Users see company profiles" ON public.profiles
  FOR SELECT USING (company_id = public.get_user_company_id());
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (id = auth.uid());
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (id = auth.uid());

-- RLS: Folders
CREATE POLICY "Users see company folders" ON public.folders
  FOR SELECT USING (company_id = public.get_user_company_id());
CREATE POLICY "Admins can create folders" ON public.folders
  FOR INSERT WITH CHECK (company_id = public.get_user_company_id() AND public.is_admin());
CREATE POLICY "Admins can update folders" ON public.folders
  FOR UPDATE USING (company_id = public.get_user_company_id() AND public.is_admin());
CREATE POLICY "Admins can delete folders" ON public.folders
  FOR DELETE USING (company_id = public.get_user_company_id() AND public.is_admin());

-- RLS: Contracts
CREATE POLICY "Users see company contracts" ON public.contracts
  FOR SELECT USING (company_id = public.get_user_company_id() AND (public.is_admin() OR public.has_folder_permission(folder_id, 'read')));
CREATE POLICY "Users with write can create contracts" ON public.contracts
  FOR INSERT WITH CHECK (company_id = public.get_user_company_id() AND (public.is_admin() OR public.has_folder_permission(folder_id, 'write')));
CREATE POLICY "Users with write can update contracts" ON public.contracts
  FOR UPDATE USING (company_id = public.get_user_company_id() AND (public.is_admin() OR public.has_folder_permission(folder_id, 'write')));
CREATE POLICY "Users with write can delete contracts" ON public.contracts
  FOR DELETE USING (company_id = public.get_user_company_id() AND (public.is_admin() OR public.has_folder_permission(folder_id, 'write')));

-- RLS: Folder permissions
CREATE POLICY "Admins manage permissions" ON public.folder_permissions
  FOR ALL USING (company_id = public.get_user_company_id() AND public.is_admin());

-- RLS: Integrations (view restricted, sensitive data)
CREATE POLICY "Admins manage integrations" ON public.integrations
  FOR ALL USING (company_id = public.get_user_company_id() AND public.is_admin());

-- RLS: Subscriptions
CREATE POLICY "Users see company subscription" ON public.subscriptions
  FOR SELECT USING (company_id = public.get_user_company_id());
CREATE POLICY "Admins manage subscription" ON public.subscriptions
  FOR ALL USING (company_id = public.get_user_company_id() AND public.is_admin());

-- Storage policies for contracts bucket
CREATE POLICY "Users can view company contracts" ON storage.objects
  FOR SELECT USING (bucket_id = 'contracts' AND (storage.foldername(name))[1] = public.get_user_company_id()::text);
CREATE POLICY "Users can upload contracts" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'contracts' AND (storage.foldername(name))[1] = public.get_user_company_id()::text);
CREATE POLICY "Users can delete contracts" ON storage.objects
  FOR DELETE USING (bucket_id = 'contracts' AND (storage.foldername(name))[1] = public.get_user_company_id()::text);

-- Trigger: auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _company_id UUID;
  _company_name TEXT;
BEGIN
  _company_name := COALESCE(NEW.raw_user_meta_data ->> 'company_name', 'Minha Empresa');
  INSERT INTO public.companies (name) VALUES (_company_name) RETURNING id INTO _company_id;
  INSERT INTO public.profiles (id, company_id, full_name, email, role)
  VALUES (
    NEW.id,
    _company_id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    NEW.email,
    'admin'
  );
  INSERT INTO public.subscriptions (company_id, status, plan)
  VALUES (_company_id, 'active', 'basic');
  INSERT INTO public.folders (company_id, name, created_by)
  VALUES (_company_id, 'Contratos de Compra', NEW.id),
         (_company_id, 'Contratos de Venda', NEW.id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

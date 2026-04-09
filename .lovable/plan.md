

# Plano: Desativar proteção de rota temporariamente

## O que será feito
Modificar `src/components/ProtectedRoute.tsx` para simplesmente renderizar o conteúdo sem verificar login ou subscription. Uma linha de código.

## Mudança técnica

**`src/components/ProtectedRoute.tsx`** — substituir toda a lógica por:
```tsx
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
```

Isso permite acessar `/dashboard` direto sem login. Nenhum outro arquivo muda.


# Changelog

Todas as versões notáveis do Hotel360 são documentadas neste arquivo.

O versionamento segue [SemVer](https://semver.org/lang/pt-BR/): `MAJOR.MINOR.PATCH`.

## Como lançar uma nova versão

1. Faça as alterações e commits normalmente.
2. Atualize a versão (root + electron ficam sincronizados):
   ```bash
   npm run version:bump patch   # ou minor / major / 1.2.3
   ```
3. Adicione uma seção neste CHANGELOG descrevendo o que mudou.
4. Rode o release (cria commit se necessário, cria a tag `vX.Y.Z` e envia ao GitHub):
   ```bash
   npm run release
   ```
5. O GitHub Actions (`electron-release.yml`) builda o instalador Windows e
   publica automaticamente na aba **Releases** do repositório.
6. Os apps Hotel360 Desktop já instalados verificam atualizações
   automaticamente (a cada 4h e ao abrir) e baixam/instalam sozinhos
   via `electron-updater`. O usuário pode também verificar manualmente
   em **Meu Perfil → Aplicativo Desktop → Verificar atualizações**.

---

## [1.1.4] - 2026-06-16

### Corrigido
- Reservas: ao avançar o status pela tela de Reservas (Check-in,
  Check-out, Cancelar), o status do quarto agora é sincronizado
  automaticamente — antes ficava preso como "reservado" mesmo após
  cancelamento ou checkout. Checkout também cria a tarefa de limpeza
  pendente automaticamente.

## [1.1.3] - 2026-06-15

### Corrigido
- Instalador agora roda em modo silencioso (`isSilent`), eliminando
  definitivamente o erro "Não é possível fechar o Hotel360" durante
  atualizações automáticas. O app reabre automaticamente após instalar.

## [1.1.2] - 2026-06-15

### Corrigido
- Atualização automática do Desktop: o servidor interno (Next.js) agora é
  encerrado antes do instalador rodar, eliminando o erro "Não é possível
  fechar o Hotel360" durante a atualização.

## [1.1.1] - 2026-06-15

### Corrigido
- Link de reserva online gerado no app Desktop agora aponta para o site
  de produção (`https://hotel360app.netlify.app`) em vez do servidor
  local (`http://127.0.0.1:3000`).
- Atribuição de quarto: estado local atualiza imediatamente após ação,
  sem precisar recarregar a página (F5).
- Navegação entre páginas com feedback visual instantâneo (spinner).

## [1.1.0] - 2026-06-14

### Adicionado
- Reserva online: seleção de tipo de quarto, valores por tipo e carrossel
  de fotos na página de reserva, com personalização (branding/templates).
- Pagamento online via Mercado Pago: vinculação da confirmação de pagamento
  à criação automática da reserva no hotel, com atribuição de quarto
  ("Atribuir Quarto") quando o pagamento é aprovado.
- Exibição de QR Code Pix na página de reserva online, com confirmação
  automática do pagamento por polling.
- Botão "Testar Conexão" em Meu Perfil para validar as credenciais do
  Mercado Pago configuradas pelo hotel.
- Fluxo de "pagamento obrigatório antes do envio": a reserva só é enviada
  ao hotel após a confirmação do pagamento (status `nao_exigido` quando o
  hotel não usa pagamento online).
- Recepcionista agora também tem acesso às páginas de Limpeza e Manutenção.

### Corrigido
- Pagamento Pix: tela não fechava mais prematuramente antes da exibição
  do QR Code/código copia-e-cola.
- Webhook do Mercado Pago: adicionado `notification_url` na criação do
  pagamento e fallback de consulta direta à API quando o webhook não
  confirma o pagamento.
- RLS: administradores do hotel agora conseguem atualizar os dados do
  próprio hotel.

## [1.0.4] - 2026-06-10

### Corrigido
- **Loop infinito de abertura do app instalado**: causado por uma release
  anterior (v1.0.0) publicada como *draft*/`untagged-...` com versão
  divergente da tag git, fazendo o `electron-updater` baixar repetidamente
  um instalador inválido para o cache (`%LOCALAPPDATA%\hotel360-desktop-updater`).
- Adicionada trava de segurança em `electron/main.js`: o auto-updater nunca
  baixa/instala uma versão igual à já instalada, mesmo que o feed de release
  esteja inconsistente.
- Corrigido caminho do ícone da janela no app empacotado (apontava para um
  arquivo inexistente dentro do `.asar`).
- Versão sincronizada (root + electron) para `1.0.4` para não colidir com
  as tags `v1.0.0`–`v1.0.3` já existentes no GitHub.

## [1.0.0] - 2026-06-10

### Adicionado
- Lançamento inicial do Hotel360 — sistema de gestão hoteleira multi-tenant.
- Módulos: Dashboard, Quartos, Hóspedes, Reservas, Check-in/Check-out,
  Limpeza, Manutenção, Financeiro e Administração (Hotéis/Usuários).
- Controle de acesso por função (RBAC): master, admin, recepcionista,
  camareira, manutenção.
- Aplicativo Desktop (Electron) com **atualização automática** via
  GitHub Releases (`electron-updater`).
- Identidade visual: ícones, logo e wallpapers do Hotel360.

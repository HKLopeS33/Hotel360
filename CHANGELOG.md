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

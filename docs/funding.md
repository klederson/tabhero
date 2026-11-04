# Apoio ao JáTá

A estratégia escolhida para o [JáTá](https://github.com/klederson/jata) é **GitHub Sponsors**, com contribuições a partir de **US$ 1**. Os valores sugeridos são **US$ 1, US$ 3, US$ 5 e US$ 10**, com valor personalizado na interface segura do GitHub. O apoio é voluntário e não condiciona o uso da extensão.

## Taxas e elegibilidade

O GitHub não cobra taxas sobre apoios feitos **por contas pessoais de quem patrocina**. Segundo a documentação, 100% desses apoios vai ao desenvolvedor ou à organização patrocinada. A regra depende da conta que **envia** o apoio, não de o destinatário ser pessoa física. Apoios feitos por contas de organizações têm tarifa de até 6%. Fonte: [taxas do GitHub Sponsors](https://docs.github.com/en/sponsors/sponsoring-open-source-contributors/about-sponsorships-fees-and-taxes).

O Brasil consta entre as regiões elegíveis para recebimento. Essa elegibilidade não substitui cadastro, verificações, formulários fiscais e aprovação. Fonte: [regiões aceitas](https://docs.github.com/en/sponsors/getting-started-with-github-sponsors/about-github-sponsors).

O mínimo adotado é US$ 1: a API oficial define valores em dólares inteiros entre 1 e 12.000 para tiers e patrocínios personalizados. Fonte: [referência Sponsors da API GraphQL](https://docs.github.com/en/graphql/reference/sponsors).

## Estado atual e configuração do site

Em 4 de novembro de 2026, a consulta pública a `https://github.com/sponsors/klederson` redirecionou ao perfil `https://github.com/klederson`. A página de recebimento ainda não está publicamente ativa. Não foi executada nenhuma mutação de cadastro, criação de tier ou pagamento durante esta documentação.

A configuração pública `funding.json` é:

```json
{
  "provider": "github",
  "currency": "USD",
  "minimum": 100,
  "presets": [100, 300, 500, 1000],
  "githubSponsors": "https://github.com/sponsors/klederson",
  "enabled": false
}
```

Os valores internos estão em centavos; a interface apresenta dólares. A existência da URL em `githubSponsors` não comprova que o recebimento esteja ativo. Enquanto `enabled` for `false`, informar **“GitHub Sponsors em preparação”**, manter o botão de pagamento indisponível e oferecer a alternativa de dar uma estrela ao [repositório](https://github.com/klederson/jata).

O site estático no GitHub Pages não precisa de backend nem de cadastro próprio. Não armazenar dados bancários, fiscais, documentos, senhas ou tokens no site ou no repositório. O GitHub pode exigir login e dados de pagamento do apoiador em seu próprio fluxo.

## Ativar o perfil pessoal de recebimento

O caminho oficial é [GitHub Sponsors → Get sponsored](https://github.com/open-source/sponsors), cujo botão aponta para [github.com/sponsors/accounts](https://github.com/sponsors/accounts). Sem autenticação, esse endereço encaminha ao login. Selecionar a conta pessoal **klederson**.

O mantenedor deve concluir o onboarding diretamente no GitHub e no fluxo Stripe Connect apresentado por ele: contato, recebimento por banco, residência e país bancário, dados fiscais, autenticação de dois fatores e solicitação de aprovação. Para recebimento bancário, a documentação exige que a região da conta bancária coincida com a região de residência. Usar os dados e o banco pessoal do próprio titular; não inserir essas informações em arquivos do projeto. Após a aprovação, verificar se a página pública realmente oferece patrocínio. Fonte: [configuração de Sponsors para conta pessoal](https://docs.github.com/en/sponsors/receiving-sponsorships-through-github-sponsors/setting-up-github-sponsors-for-your-personal-account).

No Dashboard, em **Sponsor tiers**, criar quatro tiers **One-time** de US$ 1, US$ 3, US$ 5 e US$ 10. Em **Custom amounts**, configurar mínimo de US$ 1 e uma sugestão de valor. O mínimo personalizado também se aplica a apoios recorrentes. Não prometer benefícios ainda inexistentes na descrição dos tiers. Fonte: [gerenciamento de tiers e valores personalizados](https://docs.github.com/en/sponsors/receiving-sponsorships-through-github-sponsors/managing-your-sponsorship-tiers).

## Fluxo da pessoa que apoia

A página do projeto informa os quatro valores sugeridos e oferece **“Escolher valor no GitHub”**. O destino canônico é `https://github.com/sponsors/klederson`. A escolha efetiva do tier, do valor livre e da modalidade avulsa acontece no GitHub antes da confirmação. Não apresentar um campo no site como se o valor digitado fosse transferido automaticamente ao checkout. Fonte: [como escolher tier ou valor personalizado](https://docs.github.com/en/sponsors/sponsoring-open-source-contributors/sponsoring-an-open-source-contributor-through-github).

Não foi encontrada nas fontes oficiais consultadas uma especificação de parâmetros de URL para preencher preço ou selecionar modalidade avulsa. Portanto, esta integração não acrescenta parâmetros como `amount`, `tier_id` ou `frequency=one-time`, nem promete que um preset do site já estará selecionado no GitHub. A documentação de URLs consultada descreve metadados de rastreamento; esses metadados não configuram o valor do apoio. Fonte: [metadados em URLs de Sponsors](https://docs.github.com/en/sponsors/receiving-sponsorships-through-github-sponsors/viewing-your-sponsors-and-sponsorships).

Antes de alterar `enabled` para `true`, conferir em sessão pública que a URL permanece em Sponsors, identifica Klederson Bueno, mostra o trabalho do JáTá, oferece os quatro tiers avulsos e permite valor personalizado a partir de US$ 1. Conferir o resumo da cobrança antes de confirmar qualquer pagamento. Perfil existente, abertura da página e testes com interface simulada não comprovam pagamento ou recebimento bancário.

## O que pode ser feito com GitHub CLI

A CLI permite consultas e operações GraphQL por `gh api graphql`. É possível consultar somente o estado público da listing, sem solicitar e-mails, conta Stripe ou informações bancárias:

```sh
gh api graphql -f query='query { user(login: "klederson") { sponsorsListing { isPublic url } } }'
```

Uma listing ausente ou não pública mantém `enabled: false`. A API também documenta `createSponsorsListing`, `createSponsorsTier` e `publishSponsorsTier`. Essas operações podem ajudar a preparar o perfil e os quatro tiers, mediante autorização, mas não foram executadas aqui. A criação da listing exige confirmação de residência e país bancário; não inferir esses campos somente pelo perfil público. Informações bancárias, formulários fiscais, verificações e aprovação continuam no onboarding do titular. A referência consultada não oferece uma operação que substitua todo esse processo. Fontes: [API Sponsors](https://docs.github.com/en/graphql/reference/sponsors) e [manual de gh api](https://cli.github.com/manual/gh_api).

## Botão Sponsor do repositório

Enquanto a listing estiver inativa, não declarar `github: klederson` em `.github/FUNDING.yml` como canal pronto para recebimento. Esse destino atualmente volta ao perfil. Usar `custom` com a URL pública real do site seguida de `/#apoie`, ou manter no README um link explicativo para essa seção. Não inventar uma URL de publicação.

Depois que a página de Sponsors estiver ativa e verificada, pode-se adicionar:

```yaml
github: klederson
```

Fonte: [configuração do botão Sponsor](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/displaying-a-sponsor-button-in-your-repository).

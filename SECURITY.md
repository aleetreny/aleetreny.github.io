# Security policy

Do not publish vulnerabilities or credentials in issues. Contact the owner
through the portfolio's public email address, and remove any exposed secret
before sharing context.

If a secret reaches the history:

1. revoke it immediately at the provider;
2. create a new credential with the minimum scope;
3. update GitHub Secrets/Variables or Neon;
4. review logs and usage;
5. clean the history only after coordinating it, because rewriting affects every
   clone.

`pnpm validate:repo` catches obvious patterns, but it does not replace a manual
review or a dedicated scanner.

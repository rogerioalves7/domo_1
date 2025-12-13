describe('Fluxo de Convite (Interface)', () => {

  it('Deve reconhecer um token na URL e forçar a tela de cadastro', () => {
    // 1. Simula o clique no link de convite (redirecionamento do AcceptInvite)
    // Visitamos o login passando o parametro ?invite=TOKEN_FALSO
    cy.visit('/login?invite=b84950-token-falso-uuid');

    // 2. Verifica se a UI mudou para modo "Convite"
    cy.contains('Você tem um convite pendente!').should('be.visible');
    
    // 3. Verifica se forçou a tela de Cadastro (não de Login)
    cy.contains('Crie sua nova conta').should('be.visible');
    cy.get('input[placeholder="seu@email.com"]').should('be.visible');
    
    // 4. Verifica se o botão de alternar mudou o texto
    cy.contains('Faça o login para aceitar o convite').should('be.visible');
  });

  it('Deve bloquear cadastro com email diferente do convite (Validação Backend)', () => {
    // Este teste depende do Backend estar rodando e validar o token.
    // Como o token é falso, o backend deve retornar 404 ou 400.
    
    cy.visit('/login?invite=token-inexistente');
    
    cy.get('input[placeholder="Seu nome de usuário"]').type('UsuarioTesteCy');
    cy.get('input[placeholder="seu@email.com"]').type('teste@cypress.com');
    cy.get('input[placeholder="••••••••"]').type('12345678');
    
    cy.get('button[type="submit"]').click();

    // O backend vai rejeitar o token falso
    // Verifica se o Toast de erro aparece
    cy.get('.go3958317564').should('exist'); // Classe genérica do Toast ou busque pelo texto
    // Ou verifique se não mudou de página
    cy.url().should('include', '/login');
  });

});
describe('Fluxo de Autenticação do Domo', () => {
  
  beforeEach(() => {
    cy.visit('/login');
  });

  it('Deve carregar a página de login corretamente', () => {
    cy.contains('Domo'); 
    cy.contains('Bem-vindo de volta');
  });

  it('Deve fazer login com sucesso (Cenário A)', () => {
    // Ajuste o seletor se necessário ou use data-testid
    cy.get('input[placeholder="Seu nome de usuário"]').type('teste');
    cy.get('input[placeholder="••••••••"]').type('teste'); 

    cy.get('button[type="submit"]').click();

    cy.url().should('include', '/app');
    cy.contains('Olá, admin'); 
  });

  it('Deve exibir erro ao tentar logar com credenciais inválidas', () => {
    cy.get('input[placeholder="Seu nome de usuário"]').type('usuario_inexistente');
    cy.get('input[placeholder="••••••••"]').type('senhaerrada');
    cy.get('button[type="submit"]').click();

    cy.contains('Erro ao fazer login').should('be.visible');
    cy.url().should('include', '/login');
  });

  it('Deve alternar para a tela de Cadastro', () => {
    cy.contains('Criar nova conta').click();
    
    cy.contains('Crie sua nova conta').should('be.visible');
    cy.get('input[placeholder="seu@email.com"]').should('be.visible');
    
    cy.contains('Fazer login').click();
    cy.contains('Bem-vindo de volta').should('be.visible');
  });
});
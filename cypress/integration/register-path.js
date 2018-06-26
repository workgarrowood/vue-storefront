describe('register path', () => {
  it('should register user', () => {
    cy.visit('/');
    cy.get('.modal-close').click();
    indexedDB.deleteDatabase('shop');
    cy.clearLocalStorage();
    cy.get('.header button').last().click();
    cy.get('.modal a').last().click();
    cy.get('[name=email]').type('test@test.com');
    cy.get('[name=fist-name]').type('Firstname');
    cy.get('[name=last-name]').type('Lastname');
    cy.get('[name=password]').type('Password123');
    cy.get('[name=password-confirm]').type('Password123');
    cy.get('#terms').check({ force: true });
    cy.get(".modal .cl-error").should('be.not.be.visible');
  });
});

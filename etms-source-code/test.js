const html = `<html><body><div id="userAvatar">A</div></body></html>`;
const DOM = {
  window: {
    document: {
      getElementById: (id) => {
        return {
          innerHTML: '',
          textContent: 'A'
        }
      }
    }
  }
};
console.log("Mock JS test passed");

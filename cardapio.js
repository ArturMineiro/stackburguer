document.addEventListener("DOMContentLoaded", async () => {
    try {
      const response = await fetch("modal-fade.html"); // Certifique-se de que o caminho está correto
      if (!response.ok) {
        throw new Error(`Erro ao carregar o modal: ${response.status}`);
      }
      const modalHTML = await response.text();
  
      // Insere o conteúdo do modal no DOM
      document.body.insertAdjacentHTML("beforeend", modalHTML);
    } catch (error) {
      console.error("Erro ao carregar os modais:", error);
    }
  });
  
  var qrcode = new QRCode(document.getElementById("qrcode"), {
    text: "https://forgedevapps.com/",
    width: 200,
    height: 200
});
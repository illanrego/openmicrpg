const showText = (target, message, index, interval) => {
  if (index < message.length) {
    document.querySelector(target).append(message[index++]);
    setTimeout(() => showText(target, message, index, interval), interval);
  }
};

// Call the function with:
document.addEventListener("DOMContentLoaded", () => {
  showText(
    "#text2",
    "Olá! Seja bem vindo ao mundo da Comédia Stand Up! Meu nome é Carvalho, mas open-mics me chamam de Professor Carvalho. Este mundo é habitado por coisas chamadas PIADAS! Para algumas pessoas as piadas são alívios momentâneos. Para outras, uma forma de entretenimento. Para mim... eu estudo e escrevo piadas por profissão. Mas antes de tudo, qual seu nome?",
    0,
    50,
  );
});

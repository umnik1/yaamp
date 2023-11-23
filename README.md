![](https://github.com/umnik1/yaamp/assets/2902730/70de0d28-d871-4a45-8416-0f0a09cbb198)

# Yaamp

Исходники проекта по интеграции Яндекс.Музыки и *Winamp (Webamp)*

### **Установка**

1. yarn install
2. В **node_modules/yandex-music-client** перенести папки **"core" и "services"** с заменой.
3. Поправить в package.json - "copy" на тот, на какой системе вы сейчас работаете, на данный момент настроенно на Windows

**Добавление функционала и работа с Webamp**

1. Собираем проект - [https://github.com/umnik1/yaaamp-base](https://github.com/umnik1/yaaamp-base "https://github.com/umnik1/yaaamp-base")
2. Переносим оттуда файл **webamp.bundle.js** в папку **/src/webamp**

### **Общая информация**

**Всё взаимодейстиве между electron и webamp происходит через ipc**
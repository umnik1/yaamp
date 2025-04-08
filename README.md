![](https://github.com/umnik1/yaamp/assets/2902730/70de0d28-d871-4a45-8416-0f0a09cbb198)

# Yaamp

Исходники проекта по интеграции Яндекс.Музыки и *Winamp (Webamp)*

### **Установка**

1. `yarn install` и `yarn install` в папке **webamp**
2. Поправить в **package.json** - "copy" и "deploy-webamp" на тот, на какой системе вы сейчас работаете, на данный момент настроенно на Windows

**Добавление функционала и работа с Webamp**

1. Используйте `yarn deploy-webamp` для сборки Webamp

### **Общая информация**

**Всё взаимодейстиве между electron и webamp происходит через ipc**

**Based on:** [Webamp](https://github.com/captbaritone/webamp "Webamp"), [yandex-music-api](https://github.com/MarshalX/yandex-music-api "yandex-music-api"), [yandex-music-open-api](https://github.com/acherkashin/yandex-music-open-api "yandex-music-open-api")
*While the Winamp name, interface and logo are surely property of Nullsoft.*
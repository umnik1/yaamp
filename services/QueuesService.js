"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueuesService = void 0;
var QueuesService = /** @class */ (function () {
    function QueuesService(httpRequest) {
        this.httpRequest = httpRequest;
    }
    /**
     * Получение всех очередей треков с разных устройств для синхронизации между ними
     * @param xYandexMusicDevice Содержит информацию об устройстве с которого выполняется запрос. Именно к `device` привязывается очередь. На одном устройстве может быть создана одна очередь.
     * @returns any Ok
     * @throws ApiError
     */
    QueuesService.prototype.getQueues = function (xYandexMusicDevice) {
        return this.httpRequest.request({
            method: 'GET',
            url: '/queues',
            headers: {
                'X-Yandex-Music-Device': xYandexMusicDevice,
            },
        });
    };
    /**
     * Получение очереди с треками по идентификатору
     * @param queueId Идентификатор очереди
     * @returns any Ok
     * @throws ApiError
     */
    QueuesService.prototype.getQueueById = function (queueId) {
        return this.httpRequest.request({
            method: 'GET',
            url: '/queues/{queueId}',
            path: {
                'queueId': queueId,
            },
        });
    };
    /**
     * Установка текущего индекса проигрываемого трека в очереди треков
     * @param queueId Идентификатор очереди
     * @param currentIndex Текущий индекс
     * @param isInteractive
     * @returns any Ok
     * @throws ApiError
     */
    QueuesService.prototype.updateQueuePosition = function (queueId, currentIndex, isInteractive) {
        return this.httpRequest.request({
            method: 'POST',
            url: '/queues/{queueId}/update-position',
            path: {
                'queueId': queueId,
            },
            query: {
                'currentIndex': currentIndex,
                'IsInteractive': isInteractive,
            },
        });
    };
    return QueuesService;
}());
exports.QueuesService = QueuesService;

import type { InvocationInfo } from '../models/InvocationInfo';
import type { QueueItem } from '../models/QueueItem';
import type { QueuesResult } from '../models/QueuesResult';
import type { UpdateQueueResult } from '../models/UpdateQueueResult';
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export declare class QueuesService {
    readonly httpRequest: BaseHttpRequest;
    constructor(httpRequest: BaseHttpRequest);
    /**
     * Получение всех очередей треков с разных устройств для синхронизации между ними
     * @param xYandexMusicDevice Содержит информацию об устройстве с которого выполняется запрос. Именно к `device` привязывается очередь. На одном устройстве может быть создана одна очередь.
     * @returns any Ok
     * @throws ApiError
     */
    getQueues(xYandexMusicDevice: string): CancelablePromise<{
        invocationInfo: InvocationInfo;
        result: QueuesResult;
    }>;
    /**
     * Получение очереди с треками по идентификатору
     * @param queueId Идентификатор очереди
     * @returns any Ok
     * @throws ApiError
     */
    getQueueById(queueId: string): CancelablePromise<{
        invocationInfo: InvocationInfo;
        result: QueueItem;
    }>;
    /**
     * Установка текущего индекса проигрываемого трека в очереди треков
     * @param queueId Идентификатор очереди
     * @param currentIndex Текущий индекс
     * @param isInteractive
     * @returns any Ok
     * @throws ApiError
     */
    updateQueuePosition(queueId: string, currentIndex: string, isInteractive: boolean): CancelablePromise<{
        invocationInfo: InvocationInfo;
        result: UpdateQueueResult;
    }>;
}

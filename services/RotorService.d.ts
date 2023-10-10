import type { Dashboard } from '../models/Dashboard';
import type { InvocationInfo } from '../models/InvocationInfo';
import type { Station } from '../models/Station';
import type { StationResult } from '../models/StationResult';
import type { StationTracksResult } from '../models/StationTracksResult';
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export declare class RotorService {
    readonly httpRequest: BaseHttpRequest;
    constructor(httpRequest: BaseHttpRequest);
    /**
     * Получение информации о станции и пользовательских настроек на неё
     * @param stationId ID радиостанции, для примера: user:onyourwave это моя волна
     * @returns any Ok
     * @throws ApiError
     */
    getStationInfo(stationId: string): CancelablePromise<{
        invocationInfo: InvocationInfo;
        result: Array<Station>;
    }>;
    /**
     * Получение цепочки треков определённой станции
     * @param stationId ID радиостанции, для примера: user:onyourwave это моя волна
     * @param settings2 Использовать ли второй набор настроек. Все официальные клиенты выполняют запросы с `settings2 = True`.
     * @param queue Уникальной идентификатор трека, который только что был.
     * @returns any Ok
     * @throws ApiError
     */
    getStationTracks(stationId: string, settings2?: boolean, queue?: string): CancelablePromise<{
        invocationInfo: InvocationInfo;
        result: StationTracksResult;
    }>;
    /**
     * Получение статуса пользователя с дополнителными полями
     * @returns any Ok
     * @throws ApiError
     */
    getRotorAccountStatus(): CancelablePromise<any>;
    /**
     * Получение всех радиостанций с настройками пользователя
     * @param language Язык, на котором будет информация о станциях
     * @returns any Ok
     * @throws ApiError
     */
    getStationsList(language?: string): CancelablePromise<{
        invocationInfo: InvocationInfo;
        result: Array<StationResult>;
    }>;
    /**
     * Получение рекомендованных станций текущего пользователя
     * @returns any Ok
     * @throws ApiError
     */
    getRotorStationsDashboard(): CancelablePromise<{
        invocationInfo: InvocationInfo;
        result: Array<Dashboard>;
    }>;
    /**
     * Отправка ответной реакции на происходящее при прослушивании радио. Сообщения о начале прослушивания радио, начале и конце трека, его пропуска.
     * @param stationId Станция
     * @param requestBody
     * @param batchId Уникальный идентификатор партии треков. Возвращается при получении треков. Должен отсутствовать, для типа 'radioStarted'
     * @returns any Ok
     * @throws ApiError
     */
    sendStationFeedback(stationId: string, requestBody: {
        /**
         * Тип отправляемого фидбека
         */
        type: 'radioStarted' | 'trackStarted' | 'trackFinished' | 'skip';
        /**
         * Текущее время и дата
         */
        timestamp?: string;
        /**
         * Откуда начато воспроизведение радио
         */
        from?: string;
        /**
         * Уникальной идентификатор трека
         */
        trackId?: string;
        /**
         * Сколько было проиграно секунд трека. Необходимо указывать только для типов 'trackFinished' и 'skip'
         */
        totalPlayedSeconds?: number;
    }, batchId?: string): CancelablePromise<{
        invocationInfo: InvocationInfo;
        /**
         * ok
         */
        result: string;
    }>;
}

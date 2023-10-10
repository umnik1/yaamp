"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchService = void 0;
var SearchService = /** @class */ (function () {
    function SearchService(httpRequest) {
        this.httpRequest = httpRequest;
    }
    /**
     * Осуществление поиска по запросу и типу, получение результатов
     * @param text Текст запроса
     * @param page Номер страницы выдачи
     * @param type
     * @param nococrrect
     * @returns any Ok
     * @throws ApiError
     */
    SearchService.prototype.search = function (text, page, type, nococrrect) {
        if (nococrrect === void 0) { nococrrect = false; }
        return this.httpRequest.request({
            method: 'GET',
            url: '/search',
            query: {
                'text': text,
                'page': page,
                'type': type,
                'nococrrect': nococrrect,
            },
        });
    };
    /**
     * @param part Часть поискового запроса
     * @returns any Ok
     * @throws ApiError
     */
    SearchService.prototype.getSearchSuggest = function (part) {
        return this.httpRequest.request({
            method: 'GET',
            url: '/search/suggest',
            query: {
                'part': part,
            },
        });
    };
    return SearchService;
}());
exports.SearchService = SearchService;

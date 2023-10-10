"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TagsService = void 0;
var TagsService = /** @class */ (function () {
    function TagsService(httpRequest) {
        this.httpRequest = httpRequest;
    }
    /**
     * @param tagId
     * @returns any Ok
     * @throws ApiError
     */
    TagsService.prototype.getPlaylistsIdsByTag = function (tagId) {
        return this.httpRequest.request({
            method: 'GET',
            url: '/tags/{tagId}/playlist-ids',
            path: {
                'tagId': tagId,
            },
        });
    };
    return TagsService;
}());
exports.TagsService = TagsService;

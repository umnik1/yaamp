"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.AxiosHttpRequest = void 0;
var BaseHttpRequest_1 = require("./BaseHttpRequest");
var request_1 = require("./request");
var AxiosHttpRequest = /** @class */ (function (_super) {
    __extends(AxiosHttpRequest, _super);
    function AxiosHttpRequest(config) {
        return _super.call(this, config) || this;
    }
    /**
     * Request method
     * @param options The request options from the service
     * @returns CancelablePromise<T>
     * @throws ApiError
     */
    AxiosHttpRequest.prototype.request = function (options) {
        return (0, request_1.request)(this.config, options);
    };
    return AxiosHttpRequest;
}(BaseHttpRequest_1.BaseHttpRequest));
exports.AxiosHttpRequest = AxiosHttpRequest;

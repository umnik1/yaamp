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
exports.CancelablePromise = exports.CancelError = void 0;
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
var CancelError = /** @class */ (function (_super) {
    __extends(CancelError, _super);
    function CancelError(message) {
        var _this = _super.call(this, message) || this;
        _this.name = 'CancelError';
        return _this;
    }
    Object.defineProperty(CancelError.prototype, "isCancelled", {
        get: function () {
            return true;
        },
        enumerable: false,
        configurable: true
    });
    return CancelError;
}(Error));
exports.CancelError = CancelError;
var CancelablePromise = /** @class */ (function () {
    function CancelablePromise(executor) {
        var _this = this;
        this._isResolved = false;
        this._isRejected = false;
        this._isCancelled = false;
        this._cancelHandlers = [];
        this._promise = new Promise(function (resolve, reject) {
            _this._resolve = resolve;
            _this._reject = reject;
            var onResolve = function (value) {
                var _a;
                if (_this._isResolved || _this._isRejected || _this._isCancelled) {
                    return;
                }
                _this._isResolved = true;
                (_a = _this._resolve) === null || _a === void 0 ? void 0 : _a.call(_this, value);
            };
            var onReject = function (reason) {
                var _a;
                if (_this._isResolved || _this._isRejected || _this._isCancelled) {
                    return;
                }
                _this._isRejected = true;
                (_a = _this._reject) === null || _a === void 0 ? void 0 : _a.call(_this, reason);
            };
            var onCancel = function (cancelHandler) {
                if (_this._isResolved || _this._isRejected || _this._isCancelled) {
                    return;
                }
                _this._cancelHandlers.push(cancelHandler);
            };
            Object.defineProperty(onCancel, 'isResolved', {
                get: function () { return _this._isResolved; },
            });
            Object.defineProperty(onCancel, 'isRejected', {
                get: function () { return _this._isRejected; },
            });
            Object.defineProperty(onCancel, 'isCancelled', {
                get: function () { return _this._isCancelled; },
            });
            return executor(onResolve, onReject, onCancel);
        });
    }
    CancelablePromise.prototype.then = function (onFulfilled, onRejected) {
        return this._promise.then(onFulfilled, onRejected);
    };
    CancelablePromise.prototype.catch = function (onRejected) {
        return this._promise.catch(onRejected);
    };
    CancelablePromise.prototype.finally = function (onFinally) {
        return this._promise.finally(onFinally);
    };
    CancelablePromise.prototype.cancel = function () {
        var _a;
        if (this._isResolved || this._isRejected || this._isCancelled) {
            return;
        }
        this._isCancelled = true;
        if (this._cancelHandlers.length) {
            try {
                for (var _i = 0, _b = this._cancelHandlers; _i < _b.length; _i++) {
                    var cancelHandler = _b[_i];
                    cancelHandler();
                }
            }
            catch (error) {
                console.warn('Cancellation threw an error', error);
                return;
            }
        }
        this._cancelHandlers.length = 0;
        (_a = this._reject) === null || _a === void 0 ? void 0 : _a.call(this, new CancelError('Request aborted'));
    };
    Object.defineProperty(CancelablePromise.prototype, "isCancelled", {
        get: function () {
            return this._isCancelled;
        },
        enumerable: false,
        configurable: true
    });
    return CancelablePromise;
}());
exports.CancelablePromise = CancelablePromise;
Symbol.toStringTag;

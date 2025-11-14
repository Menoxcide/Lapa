/// <reference types="node" />

declare module "simple-socks" {

    import * as net from 'net';
    import * as stream from 'stream';
    import { EventEmitter } from 'events';

    interface SocksServerEvents {
        AUTHENTICATION: 'authenticate',
        AUTHENTICATION_ERROR: 'authenticateError',
        CONNECTION_FILTER: 'connectionFilter',
        HANDSHAKE: 'handshake',
        PROXY_CONNECT: 'proxyConnect',
        PROXY_DATA: 'proxyData',
        PROXY_DISCONNECT: 'proxyDisconnect',
        PROXY_END: 'proxyEnd',
        PROXY_ERROR: 'proxyError'
    }

    interface SocksConnectionInfo {
        address: string,
        port: number
    }

    export interface SocksServerOptions {
        authentication?: (username: string, password: string, socket: net.Socket, callback: (err?: any) => void) => void;
        connectionFilter?: (destination: SocksConnectionInfo, origin: SocksConnectionInfo, callback: (err?: any, dest?: stream.Duplex) => void) => void;
    }

    export const events: SocksServerEvents;

    export interface SocksServerWithEvents extends EventEmitter {
        addListener(event: typeof events.AUTHENTICATION, listener: (username: string) => void): this;
        addListener(event: typeof events.AUTHENTICATION_ERROR, listener: (username: string, err: any) => void): this;
        addListener(event: typeof events.CONNECTION_FILTER, listener: (destination: SocksConnectionInfo, origin: SocksConnectionInfo, err: any) => void): this;
        addListener(event: typeof events.HANDSHAKE, listener: (socket: net.Socket) => void): this;
        addListener(event: typeof events.PROXY_CONNECT, listener: (info: SocksConnectionInfo, destination: net.Socket) => void): this;
        addListener(event: typeof events.PROXY_DATA, listener: (data: Buffer) => void): this;
        addListener(event: typeof events.PROXY_DISCONNECT, listener: (origin: SocksConnectionInfo, destination: SocksConnectionInfo, hadError: boolean) => void): this;
        addListener(event: typeof events.PROXY_END, listener: (response: Buffer, args: any) => void): this;
        addListener(event: typeof events.PROXY_ERROR, listener: (err: any) => void): this;
        emit(event: typeof events.AUTHENTICATION): boolean;
        emit(event: typeof events.AUTHENTICATION_ERROR): boolean;
        emit(event: typeof events.CONNECTION_FILTER): boolean;
        emit(event: typeof events.PROXY_CONNECT): boolean;
        emit(event: typeof events.PROXY_DATA): boolean;
        emit(event: typeof events.PROXY_DISCONNECT): boolean;
        emit(event: typeof events.PROXY_END): boolean;
        emit(event: typeof events.PROXY_ERROR): boolean;
        on(event: typeof events.AUTHENTICATION, listener: (username: string) => void): this;
        on(event: typeof events.AUTHENTICATION_ERROR, listener: (username: string, err: any) => void): this;
        on(event: typeof events.CONNECTION_FILTER, listener: (destination: SocksConnectionInfo, origin: SocksConnectionInfo, err: any) => void): this;
        on(event: typeof events.HANDSHAKE, listener: (socket: net.Socket) => void): this;
        on(event: typeof events.PROXY_CONNECT, listener: (info: SocksConnectionInfo, destination: net.Socket) => void): this;
        on(event: typeof events.PROXY_DATA, listener: (data: Buffer) => void): this;
        on(event: typeof events.PROXY_DISCONNECT, listener: (origin: SocksConnectionInfo, destination: SocksConnectionInfo, hadError: boolean) => void): this;
        on(event: typeof events.PROXY_END, listener: (response: Buffer, args: any) => void): this;
        on(event: typeof events.PROXY_ERROR, listener: (err: any) => void): this;
        once(event: typeof events.AUTHENTICATION, listener: (username: string) => void): this;
        once(event: typeof events.AUTHENTICATION_ERROR, listener: (username: string, err: any) => void): this;
        once(event: typeof events.CONNECTION_FILTER, listener: (destination: SocksConnectionInfo, origin: SocksConnectionInfo, err: any) => void): this;
        once(event: typeof events.HANDSHAKE, listener: (socket: net.Socket) => void): this;
        once(event: typeof events.PROXY_CONNECT, listener: (info: SocksConnectionInfo, destination: net.Socket) => void): this;
        once(event: typeof events.PROXY_DATA, listener: (data: Buffer) => void): this;
        once(event: typeof events.PROXY_DISCONNECT, listener: (origin: SocksConnectionInfo, destination: SocksConnectionInfo, hadError: boolean) => void): this;
        once(event: typeof events.PROXY_END, listener: (response: Buffer, args: any) => void): this;
        once(event: typeof events.PROXY_ERROR, listener: (err: any) => void): this;
        prependListener(event: typeof events.AUTHENTICATION, listener: (username: string) => void): this;
        prependListener(event: typeof events.AUTHENTICATION_ERROR, listener: (username: string, err: any) => void): this;
        prependListener(event: typeof events.CONNECTION_FILTER, listener: (destination: SocksConnectionInfo, origin: SocksConnectionInfo, err: any) => void): this;
        prependListener(event: typeof events.HANDSHAKE, listener: (socket: net.Socket) => void): this;
        prependListener(event: typeof events.PROXY_CONNECT, listener: (info: SocksConnectionInfo, destination: net.Socket) => void): this;
        prependListener(event: typeof events.PROXY_DATA, listener: (data: Buffer) => void): this;
        prependListener(event: typeof events.PROXY_DISCONNECT, listener: (origin: SocksConnectionInfo, destination: SocksConnectionInfo, hadError: boolean) => void): this;
        prependListener(event: typeof events.PROXY_END, listener: (response: Buffer, args: any) => void): this;
        prependListener(event: typeof events.PROXY_ERROR, listener: (err: any) => void): this;
        prependOnceListener(event: typeof events.AUTHENTICATION, listener: (username: string) => void): this;
        prependOnceListener(event: typeof events.AUTHENTICATION_ERROR, listener: (username: string, err: any) => void): this;
        prependOnceListener(event: typeof events.CONNECTION_FILTER, listener: (destination: SocksConnectionInfo, origin: SocksConnectionInfo, err: any) => void): this;
        prependOnceListener(event: typeof events.HANDSHAKE, listener: (socket: net.Socket) => void): this;
        prependOnceListener(event: typeof events.PROXY_CONNECT, listener: (info: SocksConnectionInfo, destination: net.Socket) => void): this;
        prependOnceListener(event: typeof events.PROXY_DATA, listener: (data: Buffer) => void): this;
        prependOnceListener(event: typeof events.PROXY_DISCONNECT, listener: (origin: SocksConnectionInfo, destination: SocksConnectionInfo, hadError: boolean) => void): this;
        prependOnceListener(event: typeof events.PROXY_END, listener: (response: Buffer, args: any) => void): this;
        prependOnceListener(event: typeof events.PROXY_ERROR, listener: (err: any) => void): this;
    }

    export class SocksServer {
        public options: SocksServerOptions;
        public server: net.Server & SocksServerWithEvents;
    }

    export function createServer(options?: SocksServerOptions): net.Server & SocksServerWithEvents;

}

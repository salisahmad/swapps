import { AxiosStatic } from 'axios';

declare global {
    const route: any;

    interface Window {
        axios: AxiosStatic;
    }
}

export {};

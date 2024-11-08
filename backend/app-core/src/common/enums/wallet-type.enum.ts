export enum WalletType {
    SPOT = 1,
    EARN = 2,
    GAME = 3,
}

export function getWalletType(wallet: number): string {
    switch (wallet) {
        case WalletType.SPOT:
            return 'SPOT';
        case WalletType.EARN:
            return 'EARN';
        case WalletType.GAME:
            return 'GAME';
        default:
            return '';
    }
}
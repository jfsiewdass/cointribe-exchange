export interface IPaginate<T> {
    page?: number,
    limit?: number,
    totalPages?: number,
    data: Array<T>,
    total: number;
}

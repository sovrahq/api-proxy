

export default interface Behaviour {
    resolve(did: String, method: string, url: string);
    resolveWithMetadata(did: String, method: string, url: string);
    validate(did: String, method: string): boolean;

    registry(request: any, url: string) : Promise<any>;
}
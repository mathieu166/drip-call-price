function getBscNodeArchiveProviderUrl(){
    return process.env.BSC_NODE_PROVIDER_ARCHIVE_URL
}
function getBscNodeArchiveWsProviderUrl(){
    return process.env.BSC_NODE_WS_PROVIDER_ARCHIVE_URL
}
export { getBscNodeArchiveProviderUrl, getBscNodeArchiveWsProviderUrl }
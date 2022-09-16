const updateStore = (oldStore, newData) => {
    return {
        ...oldStore, 
        ...newData
    }
}

export default updateStore;
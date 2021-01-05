

const getUnblockDate = () => {

    const date = new Date();
    const year = date.getFullYear()
    const month = date.getMonth()
    const day = date.getDate() + 1;
    const hour = date.getHours();
    const minute = date.getMinutes()
    return new Date(year, month, day, hour, minute).toString().toString().slice(0, 21);
}



const getUnblockTimer = () => {
    return Date.parse(new Date(new Date().getTime() + 1000 * 60 * 60 * 24))
}


exports.getUnblockDate = getUnblockDate
exports.getUnblockTimer = getUnblockTimer
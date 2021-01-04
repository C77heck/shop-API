

const getUnblockDate = () => {

    const date = new Date();
    const year = date.getFullYear()
    const month = date.getMonth()
    const day = date.getDate() + 1;
    const hour = date.getHours()+1;
    const minute = date.getMinutes()
    return new Date(year, month, day, hour, minute);
}


module.exports = getUnblockDate
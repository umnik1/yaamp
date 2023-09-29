function debounce(fn, time = 100) {
    let timeout

    return () => {
        const ctx = this, args = arguments
        clearTimeout(timeout)
        timeout = setTimeout(() => fn.apply(ctx, args), time)
    }
}

module.exports = {
    debounce
}

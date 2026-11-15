export const catchAsyncError = (Func) => {

    return (req, res, next) => {
        Promise.resolve(Func(req, res, next)).catch(next);
    };
};


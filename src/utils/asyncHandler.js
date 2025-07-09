const asyncHandler = (requestHandler) => {
    return (req, res, next) => {
        Promise.resolve(requestHandler(req, res, next)).
            catch((err) => next(err))
    }
}

// two ways to handle --> up and down

export { asyncHandler }


// Higher Order function

// const asyncHandler = () => { }
// const asyncHandler = (func) => { () => { } }  or const asyncHandler = (func) => { () => { } }
// const asyncHandler = (func) => async() => { }


//     // this is a wrapper function , it will be used most of the times
// const asyncHandler =(fn)=>async(req,res,next)=>{
//     try{
//         await fn(req,res,next)
//     }catch(error){
//         res.status(error.code || 500).json({
//             success: false,
//             message: error.message
//         })
//     }
// }
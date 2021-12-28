
export default function Alert(props) {

    function onClickClose(event) {
        var div = event.currentTarget.parentNode;
        div.style.opacity = "0";
        setTimeout(function () { div.style.display = "none"; }, 0);
    }

    let style = [];

    if (props.type === "success") {
        style = ["flex p-4 mb-4 bg-green-100 rounded-lg dark:bg-green-200", "flex-shrink-0 w-5 h-5 text-green-700 dark:text-green-800", "ml-3 text-sm font-medium text-green-700 dark:text-green-800", "ml-auto -mx-1.5 -my-1.5 bg-green-100 text-green-500 rounded-lg focus:ring-2 focus:ring-green-400 p-1.5 hover:bg-green-200 inline-flex h-8 w-8 dark:bg-green-200 dark:text-green-600 dark:hover:bg-green-300"];
    } else if (props.type === "warning") {
        style = ["flex p-4 mb-4 bg-yellow-100 rounded-lg dark:bg-yellow-200", "flex-shrink-0 w-5 h-5 text-yellow-700 dark:text-yellow-800", "ml-3 text-sm font-medium text-yellow-700 dark:text-yellow-800", "ml-auto -mx-1.5 -my-1.5 bg-yellow-100 text-yellow-500 rounded-lg focus:ring-2 focus:ring-yellow-400 p-1.5 hover:bg-yellow-200 inline-flex h-8 w-8 dark:bg-yellow-200 dark:text-yellow-600 dark:hover:bg-yellow-300"];
    } else if (props.type === "danger") { 
        style = ["flex p-4 mb-4 bg-red-100 rounded-lg dark:bg-red-200", "flex-shrink-0 w-5 h-5 text-red-700 dark:text-red-800", "ml-3 text-sm font-medium text-red-700 dark:text-red-800", "ml-auto -mx-1.5 -my-1.5 bg-red-100 text-red-500 rounded-lg focus:ring-2 focus:ring-red-400 p-1.5 hover:bg-red-200 inline-flex h-8 w-8 dark:bg-red-200 dark:text-red-600 dark:hover:bg-red-300"];
    } else {
        style = ["flex p-4 mb-4 bg-blue-100 rounded-lg dark:bg-blue-200", "flex-shrink-0 w-5 h-5 text-blue-700 dark:text-blue-800", "ml-3 text-sm font-medium text-blue-700 dark:text-blue-800", "ml-auto -mx-1.5 -my-1.5 bg-blue-100 text-blue-500 rounded-lg focus:ring-2 focus:ring-blue-400 p-1.5 hover:bg-blue-200 inline-flex h-8 w-8 dark:bg-blue-200 dark:text-blue-600 dark:hover:bg-blue-300"];
    }
    return (
        <div className="pb-4" id={props.type}>
            <div className={style[0]} role="alert">
                <svg className={style[1]} fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path></svg>
                <div className={style[2]}>
                    {props.children}
                </div>
                <button onClick={onClickClose} type="button" className={style[3]} data-collapse-toggle="alert" aria-label="Close">
                    <span className="sr-only">Close</span>
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
                </button>
            </div>
        </div>
    )
}
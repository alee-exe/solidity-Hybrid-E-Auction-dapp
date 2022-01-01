// Tooltip Tailwind CSS template from https://app.tailwinduikit.com/listing/webapp/UI_element/tooltip
import { useState } from 'react';

export default function TooltipComponent(props) {

    const { header, message } = props;

    const [tooltipStatus, setTooltipStatus] = useState(0);

    return (
        <div className="relative mt-20 md:mt-0" onMouseEnter={() => setTooltipStatus(1)} onMouseLeave={() => setTooltipStatus(0)}>
            <div className="mr-2 cursor-pointer">
                <svg aria-haspopup="true" xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-info-circle" width={25} height={25} viewBox="0 0 24 24" strokeWidth="1.5" stroke="#A0AEC0" fill="none" strokeLinecap="round" strokeLinejoin="round">
                    <path stroke="none" d="M0 0h24v24H0z" />
                    <circle cx={12} cy={12} r={9} />
                    <line x1={12} y1={8} x2="12.01" y2={8} />
                    <polyline points="11 12 12 12 12 16 13 16" />
                </svg>
            </div>
            {tooltipStatus == 1 && (
                <div role="tooltip" className="z-20 -mt-20 w-64 absolute transition duration-150 ease-in-out left-0 ml-8 shadow-lg bg-white p-4 rounded">
                    <svg className="absolute left-0 -ml-2 bottom-0 top-0 h-full" width="9px" height="16px" viewBox="0 0 9 16" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink">
                        <g id="Page-1" stroke="none" strokeWidth={1} fill="none" fillRule="evenodd">
                            <g id="Tooltips-" transform="translate(-874.000000, -1029.000000)" fill="#FFFFFF">
                                <g id="Group-3-Copy-16" transform="translate(850.000000, 975.000000)">
                                    <g id="Group-2" transform="translate(24.000000, 0.000000)">
                                        <polygon id="Triangle" transform="translate(4.500000, 62.000000) rotate(-90.000000) translate(-4.500000, -62.000000) " points="4.5 57.5 12.5 66.5 -3.5 66.5" />
                                    </g>
                                </g>
                            </g>
                        </g>
                    </svg>
                    <p className="text-base font-bold text-gray-800 pb-1">{header}</p>
                    <p className="text-sm leading-4 text-gray-600 pb-3">{message}</p>
                </div>
            )}{" "}
        </div>
    )
}


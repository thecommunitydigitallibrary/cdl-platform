"use client"

import * as React from "react"
import ExpandCircleDownIcon from '@mui/icons-material/ExpandCircleDown';

import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "../components/ui/ui/collapsible"

import { Button } from "../components/ui/ui/button"


export function CollapsibleDemo() {
    const [isOpen, setIsOpen] = React.useState(false);

    return (
        <Collapsible
            open={isOpen}
            onOpenChange={setIsOpen}
            className="w-full space-y-2"
        >
            <div className="flex items-center justify-between space-x-4 px-4">
                <h4 className="text-sm font-semibold link-style">
                    Community 1
                </h4>
                <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm">
                        <ExpandCircleDownIcon className="h-4 w-4 link-style" />
                        <span className="sr-only">Toggle</span>
                    </Button>
                </CollapsibleTrigger>
            </div>
            {/* <div className="rounded-md border px-4 py-2 font-mono text-sm shadow-sm link-style">
                Submission 1
            </div> */}
            <CollapsibleContent className="space-y-2">
                <div className="rounded-md border px-4 py-2 font-mono text-sm shadow-sm link-style">
                    Submission 1
                </div>
                <div className="rounded-md border px-4 py-2 font-mono text-sm shadow-sm link-style">
                    Submission 2
                </div>
            </CollapsibleContent>
        </Collapsible>
    );
}


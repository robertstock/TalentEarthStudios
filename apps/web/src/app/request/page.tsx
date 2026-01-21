import { Suspense } from "react";
import RequestForm from "./form";

export default function RequestPage() {
    return (
        <Suspense fallback={<div className="container mx-auto py-12 px-6 text-center">Loading form...</div>}>
            <RequestForm />
        </Suspense>
    );
}

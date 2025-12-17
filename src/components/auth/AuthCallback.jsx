import { useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";

export default function AuthCallback() {
    useEffect(() => {
        const run = async () => {
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                alert("Verification complete. Please log in.");
                window.location.href = "/";
                return;
            }

            localStorage.setItem("access_token", session.access_token);

            window.location.href = "/";
        };

        run();
    }, []);

    return (
        <div className="h-screen flex-center text-white text-xl">
            Completing sign-in...
        </div>
    );
}

import { Heart } from "lucide-react";
import { useEffect, useState } from "react";
import {
	getCachedUser,
	loadCurrentUser,
	subscribeToAuth,
} from "../lib/auth-client";

export default function FavoriteButton({
	slug,
	initialFavorited,
}: {
	slug: string;
	initialFavorited: boolean;
}) {
	const [user, setUser] = useState(getCachedUser());
	const [favorited, setFavorited] = useState(initialFavorited);
	const [saving, setSaving] = useState(false);
	useEffect(() => {
		const unsubscribe = subscribeToAuth(setUser);
		void loadCurrentUser().then(setUser);
		return unsubscribe;
	}, []);
	if (!user) return null;
	async function toggle() {
		if (saving) return;
		const next = !favorited;
		setSaving(true);
		try {
			const response = await fetch("/api/favorites", {
				method: "POST",
				credentials: "same-origin",
				headers: {
					"Content-Type": "application/json",
					"X-EmDash-Request": "1",
				},
				body: JSON.stringify({ slug, favorited: next }),
			});
			if (!response.ok) throw new Error("Favorite update failed");
			setFavorited(next);
		} finally {
			setSaving(false);
		}
	}
	return (
		<button
			type="button"
			onClick={toggle}
			disabled={saving}
			aria-pressed={favorited}
			aria-label={favorited ? "Remove from favorites" : "Add to favorites"}
			className="inline-flex items-center gap-2 rounded-full border px-4 py-2 font-bold hover:bg-muted disabled:opacity-50"
		>
			<Heart
				size={18}
				fill={favorited ? "currentColor" : "none"}
				aria-hidden="true"
			/>
			{favorited ? "Favorited" : "Favorite"}
		</button>
	);
}

import { Badge } from "@/components/ui/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import type { RecipeListItem } from "./RecipeBrowser";

function imageUrl(image: NonNullable<RecipeListItem["image"]>) {
	if (image.src) return image.src;
	const key = image.storageKey || image.id;
	return `/_emdash/api/media/file/${encodeURIComponent(key)}`;
}

export default function RecipeCard({ item }: { item: RecipeListItem }) {
	return (
		<a className="block h-full no-underline" href={`/recipes/${item.slug}`}>
			<Card className="h-full min-w-0 gap-0 overflow-hidden py-0 transition-shadow hover:shadow-md">
				<CardHeader className="gap-0 p-0">
					{item.image ? (
						<img
							className="h-52 w-full object-cover"
							src={imageUrl(item.image)}
							alt={item.image.alt}
							loading="lazy"
							style={{
								viewTransitionName: `recipe-image-${item.slug.replace(/[^a-zA-Z0-9_-]/g, "-")}`,
							}}
						/>
					) : (
						<div className="grid h-52 place-items-center bg-linear-to-br from-secondary to-primary font-black tracking-widest text-primary-foreground">
							Recipe
						</div>
					)}
				</CardHeader>
				<CardContent className="p-5">
					<div className="flex flex-wrap gap-1.5">
						{item.sourceType === "hellofresh" && (
							<small className="font-extrabold tracking-widest text-primary uppercase">
								HelloFresh
							</small>
						)}
						{item.mealTypeLabels.map((term) => (
							<Badge key={term.slug} variant="secondary">
								{term.label}
							</Badge>
						))}
						{item.dietaryLabels.map((term) => (
							<Badge key={term.slug} variant="outline">
								{term.label}
							</Badge>
						))}
					</div>
					<CardTitle className="my-1 text-xl font-black tracking-[-.04em]">
						{item.title}
					</CardTitle>
					{item.summary && (
						<CardDescription className="leading-relaxed">
							{item.summary}
						</CardDescription>
					)}
				</CardContent>
			</Card>
		</a>
	);
}

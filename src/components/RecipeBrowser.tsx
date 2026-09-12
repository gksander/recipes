import { useDebouncedValue } from "@tanstack/react-pacer";
import { useEffect, useMemo, useState } from "react";

type Term = { slug: string; label: string };

export type RecipeListItem = {
	slug: string;
	title: string;
	summary: string | null;
	image: { src: string; alt: string } | null;
	mealTypes: string[];
	dietary: string[];
	ingredients: string[];
};

type PdfListItem = {
	slug: string;
	title: string;
	sourceFilename: string;
};

interface Props {
	recipes: RecipeListItem[];
	pdfs?: PdfListItem[];
	mealTypes: Term[];
	dietaryTerms: Term[];
	ingredientTerms: Term[];
	initialMeal?: string;
	initialDietary?: string[];
	initialIngredient?: string;
	initialQuery?: string;
}

const PAGE_SIZE = 50;

function values(key: string) {
	return [
		...new Set(
			(new URLSearchParams(window.location.search).get(key) ?? "")
				.split(",")
				.filter(Boolean),
		),
	];
}

export default function RecipeBrowser({
	recipes,
	pdfs = [],
	mealTypes,
	dietaryTerms,
	ingredientTerms,
	initialMeal = "",
	initialDietary = [],
	initialIngredient = "",
	initialQuery = "",
}: Props) {
	const [meal, setMeal] = useState(initialMeal);
	const [dietary, setDietary] = useState(initialDietary);
	const [ingredient, setIngredient] = useState(initialIngredient);
	const [query, setQuery] = useState(initialQuery);
	const [page, setPage] = useState(1);
	const [debouncedQuery] = useDebouncedValue(query, { wait: 300 });

	const filteredRecipes = useMemo(() => {
		const search = debouncedQuery.trim().toLowerCase();
		return recipes.filter(
			(recipe) =>
				(!meal || recipe.mealTypes.includes(meal)) &&
				dietary.every((term) => recipe.dietary.includes(term)) &&
				(!ingredient || recipe.ingredients.includes(ingredient)) &&
				(!search ||
					`${recipe.title} ${recipe.summary ?? ""}`
						.toLowerCase()
						.includes(search)),
		);
	}, [debouncedQuery, dietary, ingredient, meal, recipes]);

	const filteredPdfs = useMemo(() => {
		if (meal || dietary.length || ingredient) return [];
		const search = debouncedQuery.trim().toLowerCase();
		return pdfs.filter(
			(pdf) =>
				!search ||
				`${pdf.title} ${pdf.sourceFilename}`.toLowerCase().includes(search),
		);
	}, [debouncedQuery, dietary.length, ingredient, meal, pdfs]);

	const items = useMemo(
		() => [
			...filteredRecipes.map((entry) => ({ type: "recipe" as const, entry })),
			...filteredPdfs.map((entry) => ({ type: "pdf" as const, entry })),
		],
		[filteredPdfs, filteredRecipes],
	);
	const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
	const currentPage = Math.min(page, totalPages);
	const visibleItems = items.slice(
		(currentPage - 1) * PAGE_SIZE,
		currentPage * PAGE_SIZE,
	);

	useEffect(() => {
		setPage(1);
	}, [debouncedQuery, dietary, ingredient, meal]);

	useEffect(() => {
		const params = new URLSearchParams(window.location.search);
		meal ? params.set("meal", meal) : params.delete("meal");
		dietary.length
			? params.set("dietary", dietary.join(","))
			: params.delete("dietary");
		ingredient
			? params.set("ingredient", ingredient)
			: params.delete("ingredient");
		debouncedQuery ? params.set("q", debouncedQuery) : params.delete("q");
		params.delete("page");
		window.history.replaceState(
			{},
			"",
			`${window.location.pathname}${params.size ? `?${params}` : ""}`,
		);
	}, [debouncedQuery, dietary, ingredient, meal]);

	const clear = () => {
		setMeal("");
		setDietary([]);
		setIngredient("");
		setQuery("");
	};

	return (
		<div className="grid gap-8 lg:grid-cols-[17rem_minmax(0,1fr)]">
			<aside
				className="recipe-filter-rail self-start rounded-3xl border border-recipe-line bg-white p-5 shadow-[0_8px_30px_rgb(35_28_15_/_0.06)] lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto"
				aria-label="Filter recipes"
			>
				<div className="flex items-start justify-between gap-3 border-b border-recipe-line pb-4">
					<div>
						<p className="m-0 text-[.7rem] font-extrabold tracking-widest text-recipe-orange uppercase">
							Recipe finder
						</p>
						<h3 className="m-0 mt-1 text-xl font-black tracking-[-.04em]">
							Filter recipes
						</h3>
					</div>
					{(meal || dietary.length || ingredient || query) && (
						<button
							className="text-sm font-bold text-recipe-muted"
							type="button"
							onClick={clear}
						>
							Clear
						</button>
					)}
				</div>
				<label className="mt-4 block text-sm font-extrabold">
					Search
					<input
						className="mt-2 h-11 w-full rounded-xl border border-recipe-line bg-white px-3 font-normal outline-none focus:border-recipe-purple"
						type="search"
						value={query}
						onChange={(event) => setQuery(event.currentTarget.value)}
						placeholder="Title or summary"
					/>
				</label>
				<label className="mt-4 block text-sm font-extrabold">
					Meal type
					<select
						className="mt-2 h-11 w-full rounded-xl border border-recipe-line bg-white px-3 font-normal"
						value={meal}
						onChange={(event) => setMeal(event.currentTarget.value)}
					>
						<option value="">Any meal type</option>
						{mealTypes.map((term) => (
							<option key={term.slug} value={term.slug}>
								{term.label}
							</option>
						))}
					</select>
				</label>
				<fieldset className="mt-5 border-0 border-b border-recipe-line p-0 pb-4">
					<legend className="text-sm font-extrabold">
						Dietary preferences
					</legend>
					<div className="mt-2 grid gap-2">
						{dietaryTerms.map((term) => (
							<label
								className="flex items-center gap-2 text-sm text-recipe-muted"
								key={term.slug}
							>
								<input
									type="checkbox"
									checked={dietary.includes(term.slug)}
									onChange={(event) =>
										setDietary((current) =>
											event.currentTarget.checked
												? [...current, term.slug]
												: current.filter((value) => value !== term.slug),
										)
									}
								/>
								{term.label}
							</label>
						))}
					</div>
				</fieldset>
				<label className="mt-4 block text-sm font-extrabold">
					Ingredient
					<select
						className="mt-2 h-11 w-full rounded-xl border border-recipe-line bg-white px-3 font-normal"
						value={ingredient}
						onChange={(event) => setIngredient(event.currentTarget.value)}
					>
						<option value="">Any ingredient</option>
						{ingredientTerms.map((term) => (
							<option key={term.slug} value={term.slug}>
								{term.label}
							</option>
						))}
					</select>
				</label>
			</aside>
			<div>
				<div className="mb-5 flex items-end justify-between gap-3">
					<p className="m-0 text-recipe-muted" aria-live="polite">
						{items.length} {items.length === 1 ? "recipe" : "recipes"} found
					</p>
					{debouncedQuery !== query && (
						<span className="text-sm text-recipe-muted">Searching…</span>
					)}
				</div>
				{visibleItems.length ? (
					<ul className="m-0 grid grid-cols-1 gap-5 p-0 sm:grid-cols-2 xl:grid-cols-3">
						{visibleItems.map((item) =>
							item.type === "recipe" ? (
								<li
									className="overflow-hidden rounded-2xl bg-white shadow-[0_4px_18px_rgb(26_22_15_/_0.05)]"
									key={item.entry.slug}
								>
									<a
										className="block h-full no-underline"
										href={`/recipes/${item.entry.slug}`}
									>
										{item.entry.image ? (
											<img
												className="h-52 w-full object-cover"
												src={item.entry.image.src}
												alt={item.entry.image.alt}
												loading="lazy"
											/>
										) : (
											<div className="grid h-52 place-items-center bg-linear-to-br from-amber-200 to-amber-500 font-black tracking-widest text-white">
												Recipe
											</div>
										)}
										<div className="p-5">
											<small className="font-extrabold tracking-widest text-recipe-orange uppercase">
												Recipe
											</small>
											<h3 className="my-1 text-xl font-black tracking-[-.04em]">
												{item.entry.title}
											</h3>
											{item.entry.summary && (
												<p className="m-0 leading-relaxed text-recipe-muted">
													{item.entry.summary}
												</p>
											)}
										</div>
									</a>
								</li>
							) : (
								<li
									className="overflow-hidden rounded-2xl bg-white shadow-[0_4px_18px_rgb(26_22_15_/_0.05)]"
									key={item.entry.slug}
								>
									<a
										className="block h-full no-underline"
										href={`/recipe-library/${item.entry.slug}/pdf`}
									>
										<div className="grid h-52 place-items-center bg-linear-to-br from-amber-200 to-amber-500 font-black tracking-widest text-white">
											PDF
										</div>
										<div className="p-5">
											<small className="font-extrabold tracking-widest text-recipe-orange uppercase">
												Recipe PDF
											</small>
											<h3 className="my-1 text-xl font-black tracking-[-.04em]">
												{item.entry.title}
											</h3>
											<p className="m-0 leading-relaxed text-recipe-muted">
												Open the original recipe PDF.
											</p>
										</div>
									</a>
								</li>
							),
						)}
					</ul>
				) : (
					<div className="py-16 text-center">
						<h3 className="text-xl font-black">
							No recipes match those filters.
						</h3>
						<button
							className="mt-2 text-recipe-purple underline"
							type="button"
							onClick={clear}
						>
							Clear filters
						</button>
					</div>
				)}
				{totalPages > 1 && (
					<nav
						className="mt-8 flex flex-wrap justify-center gap-1"
						aria-label="Recipe pages"
					>
						<button
							className="rounded-lg border border-recipe-line px-3 py-2 disabled:pointer-events-none disabled:opacity-40"
							type="button"
							disabled={currentPage === 1}
							onClick={() => setPage((value) => value - 1)}
						>
							Previous
						</button>
						{Array.from({ length: totalPages }, (_, index) => index + 1).map(
							(number) => (
								<button
									className={`min-w-10 rounded-lg border border-recipe-line px-3 py-2 ${number === currentPage ? "border-recipe-ink bg-recipe-ink text-white" : ""}`}
									type="button"
									aria-current={number === currentPage ? "page" : undefined}
									onClick={() => setPage(number)}
									key={number}
								>
									{number}
								</button>
							),
						)}
						<button
							className="rounded-lg border border-recipe-line px-3 py-2 disabled:pointer-events-none disabled:opacity-40"
							type="button"
							disabled={currentPage === totalPages}
							onClick={() => setPage((value) => value + 1)}
						>
							Next
						</button>
					</nav>
				)}
			</div>
		</div>
	);
}

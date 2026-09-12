import { useDebouncedValue } from "@tanstack/react-pacer";
import { useEffect, useMemo, useState } from "react";
import { CheckIcon } from "lucide-react";
import { Combobox as ComboboxPrimitive } from "@base-ui/react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Combobox,
	ComboboxContent,
	ComboboxChip,
	ComboboxChips,
	ComboboxChipsInput,
	ComboboxEmpty,
	ComboboxInput,
	ComboboxItem,
	ComboboxList,
} from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

type Term = { slug: string; label: string };

type ImageValue = {
	id: string;
	src: string | null;
	storageKey: string | null;
	alt: string;
};

export type RecipeListItem = {
	slug: string;
	title: string;
	summary: string | null;
	image: ImageValue | null;
	mealTypes: string[];
	dietary: string[];
	ingredients: string[];
};

type PdfListItem = {
	slug: string;
	title: string;
	sourceFilename: string;
	image: ImageValue | null;
};

interface Props {
	recipes: RecipeListItem[];
	pdfs?: PdfListItem[];
	mealTypes: Term[];
	dietaryTerms: Term[];
	ingredientTerms: Term[];
	initialMeal?: string;
	initialDietary?: string[];
	initialIngredient?: string[];
	initialQuery?: string;
}

function MultiCombobox({
	options,
	value,
	onChange,
	placeholder,
}: {
	options: Term[];
	value: string[];
	onChange: (value: string[]) => void;
	placeholder: string;
}) {
	const items = useMemo(
		() =>
			ComboboxPrimitive.createItems(options, {
				getValue: (item: Term) => item.slug,
				getLabel: (item: Term) => item.label,
			}),
		[options],
	);
	const labels = new Map(options.map((option) => [option.slug, option.label]));
	return (
		<Combobox multiple items={items} value={value} onValueChange={onChange}>
			<ComboboxChips className="mt-2 min-h-12 rounded-xl bg-background sm:mt-3">
				{value.map((selected) => (
					<ComboboxChip
						className="rounded-md bg-secondary px-2 py-1 text-sm text-secondary-foreground"
						key={selected}
					>
						{labels.get(selected) ?? selected}
					</ComboboxChip>
				))}
				<ComboboxChipsInput
					className="min-w-24 py-1 text-base font-normal"
					aria-label={placeholder}
					placeholder={value.length ? "Add another" : placeholder}
				/>
			</ComboboxChips>
			<ComboboxContent>
				<ComboboxEmpty>No matches found.</ComboboxEmpty>
				<ComboboxList>
					{(item: Term) => (
						<ComboboxItem key={item.slug} value={item.slug}>
							<CheckIcon className="mr-2 size-4 opacity-0 data-[selected]:opacity-100" />
							{item.label}
						</ComboboxItem>
					)}
				</ComboboxList>
			</ComboboxContent>
		</Combobox>
	);
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

function imageUrl(image: ImageValue) {
	if (image.src) return image.src;
	const key = image.storageKey || image.id;
	return `/_emdash/api/media/file/${encodeURIComponent(key)}`;
}

export default function RecipeBrowser({
	recipes,
	pdfs = [],
	mealTypes,
	dietaryTerms,
	ingredientTerms,
	initialMeal = "",
	initialDietary = [],
	initialIngredient = [],
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
				ingredient.every((term) => recipe.ingredients.includes(term)) &&
				(!search ||
					`${recipe.title} ${recipe.summary ?? ""}`
						.toLowerCase()
						.includes(search)),
		);
	}, [debouncedQuery, dietary, ingredient, meal, recipes]);

	const filteredPdfs = useMemo(() => {
		if (meal || dietary.length || ingredient.length) return [];
		const search = debouncedQuery.trim().toLowerCase();
		return pdfs.filter(
			(pdf) =>
				!search ||
				`${pdf.title} ${pdf.sourceFilename}`.toLowerCase().includes(search),
		);
	}, [debouncedQuery, dietary.length, ingredient.length, meal, pdfs]);

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
		ingredient.length
			? params.set("ingredient", ingredient.join(","))
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
		setIngredient([]);
		setQuery("");
	};

	return (
		<div className="grid gap-8 lg:grid-cols-[17rem_minmax(0,1fr)]">
			<aside
				className="recipe-filter-rail self-start lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto"
				aria-label="Filter recipes"
			>
				<Card className="gap-4 rounded-3xl p-5 shadow-lg sm:gap-6">
					<div className="flex items-start justify-between gap-3">
						<div>
							<CardTitle className="text-2xl font-black tracking-[-.04em]">
								Filter recipes
							</CardTitle>
						</div>
						{(meal || dietary.length || ingredient.length || query) && (
							<button
								className="text-sm font-bold text-muted-foreground"
								type="button"
								onClick={clear}
							>
								Clear
							</button>
						)}
					</div>
					<label className="block text-base font-extrabold">
						Search
						<Input
							className="mt-2 h-12 text-base font-normal sm:mt-3"
							type="search"
							value={query}
							onChange={(event) => setQuery(event.currentTarget.value)}
							placeholder="Title or summary"
						/>
					</label>
					<label className="block text-base font-extrabold">
						Meal type
						<Select
							value={meal || "any"}
							onValueChange={(value) =>
								setMeal(value === "any" ? "" : (value ?? ""))
							}
						>
							<SelectTrigger
								className="mt-2 h-12 w-full text-base font-normal sm:mt-3"
								aria-label="Meal type"
							>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectGroup>
									<SelectItem value="any">Any meal type</SelectItem>
									{mealTypes.map((term) => (
										<SelectItem key={term.slug} value={term.slug}>
											{term.label}
										</SelectItem>
									))}
								</SelectGroup>
							</SelectContent>
						</Select>
					</label>
					<div>
						<label
							className="block text-base font-extrabold"
							htmlFor="dietary-preferences"
						>
							Dietary preferences
						</label>
						<div id="dietary-preferences">
							<MultiCombobox
								options={dietaryTerms}
								value={dietary}
								onChange={setDietary}
								placeholder="Any dietary preference"
							/>
						</div>
					</div>
					<label className="block text-base font-extrabold">
						Ingredient
						<MultiCombobox
							label="Ingredient"
							options={ingredientTerms}
							value={ingredient}
							onChange={setIngredient}
							placeholder="Any ingredient"
						/>
					</label>
				</Card>
			</aside>
			<div>
				{visibleItems.length ? (
					<ul className="m-0 grid grid-cols-1 gap-5 p-0 sm:grid-cols-2 xl:grid-cols-3">
						{visibleItems.map((item) =>
							item.type === "recipe" ? (
								<li key={item.entry.slug}>
									<a
										className="block h-full no-underline"
										href={`/recipes/${item.entry.slug}`}
									>
										<Card className="h-full gap-0 overflow-hidden py-0 transition-shadow hover:shadow-md">
											<CardHeader className="gap-0 p-0">
												{item.entry.image ? (
													<img
														className="h-52 w-full object-cover"
														src={imageUrl(item.entry.image)}
														alt={item.entry.image.alt}
														loading="lazy"
													/>
												) : (
													<div className="grid h-52 place-items-center bg-linear-to-br from-secondary to-primary font-black tracking-widest text-primary-foreground">
														Recipe
													</div>
												)}
											</CardHeader>
											<CardContent className="p-5">
												<small className="font-extrabold tracking-widest text-primary uppercase">
													Recipe
												</small>
												<CardTitle className="my-1 text-xl font-black tracking-[-.04em]">
													{item.entry.title}
												</CardTitle>
												{item.entry.summary && (
													<CardDescription className="leading-relaxed">
														{item.entry.summary}
													</CardDescription>
												)}
											</CardContent>
										</Card>
									</a>
								</li>
							) : (
								<li key={item.entry.slug}>
									<a
										className="block h-full no-underline"
										href={`/recipe-library/${item.entry.slug}/pdf`}
									>
										<Card className="h-full gap-0 overflow-hidden py-0 transition-shadow hover:shadow-md">
											<CardHeader className="gap-0 p-0">
												{item.entry.image ? (
													<img
														className="h-52 w-full object-cover"
														src={imageUrl(item.entry.image)}
														alt={item.entry.image.alt}
														loading="lazy"
													/>
												) : (
													<div className="grid h-52 place-items-center bg-linear-to-br from-secondary to-primary font-black tracking-widest text-primary-foreground">
														PDF
													</div>
												)}
											</CardHeader>
											<CardContent className="p-5">
												<small className="font-extrabold tracking-widest text-primary uppercase">
													Recipe PDF
												</small>
												<CardTitle className="my-1 text-xl font-black tracking-[-.04em]">
													{item.entry.title}
												</CardTitle>
												<CardDescription className="leading-relaxed">
													Open the original recipe PDF.
												</CardDescription>
											</CardContent>
										</Card>
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
							className="mt-2 text-primary underline"
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
							className="rounded-md border border-border px-3 py-2 disabled:pointer-events-none disabled:opacity-40"
							type="button"
							disabled={currentPage === 1}
							onClick={() => setPage((value) => value - 1)}
						>
							Previous
						</button>
						{Array.from({ length: totalPages }, (_, index) => index + 1).map(
							(number) => (
								<button
									className={`min-w-10 rounded-md border border-border px-3 py-2 ${number === currentPage ? "border-foreground bg-foreground text-background" : ""}`}
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
							className="rounded-md border border-border px-3 py-2 disabled:pointer-events-none disabled:opacity-40"
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

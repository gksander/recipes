import { useDebouncedValue } from "@tanstack/react-pacer";
import { useEffect, useMemo, useState } from "react";
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
	useComboboxAnchor,
} from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Pagination,
	PaginationContent,
	PaginationEllipsis,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from "@/components/ui/pagination";

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
	mealTypeLabels: Term[];
	dietary: string[];
	dietaryLabels: Term[];
	ingredients: string[];
};

type PdfListItem = {
	slug: string;
	title: string;
	sourceFilename: string;
	image: ImageValue | null;
	dietary: string[];
	ingredients: string[];
};

interface Props {
	recipes: RecipeListItem[];
	pdfs?: PdfListItem[];
	mealTypes: Term[];
	dietaryTerms: Term[];
	ingredientTerms: Term[];
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
	const anchor = useComboboxAnchor();
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
			<ComboboxChips
				ref={anchor}
				className="mt-2 min-h-12 bg-background sm:mt-3"
			>
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
			<ComboboxContent anchor={anchor}>
				<ComboboxEmpty>No matches found.</ComboboxEmpty>
				<ComboboxList>
					{(item: Term) => (
						<ComboboxItem key={item.slug} value={item.slug}>
							{item.label}
						</ComboboxItem>
					)}
				</ComboboxList>
			</ComboboxContent>
		</Combobox>
	);
}

const PAGE_SIZE = 50;

function pageItems(currentPage: number, totalPages: number) {
	if (totalPages <= 5)
		return Array.from({ length: totalPages }, (_, index) => index + 1);
	if (currentPage <= 3) return [1, 2, 3, "ellipsis", totalPages] as const;
	if (currentPage >= totalPages - 2)
		return [1, "ellipsis", totalPages - 2, totalPages - 1, totalPages] as const;
	return [1, "ellipsis", currentPage, "ellipsis-end", totalPages] as const;
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
}: Props) {
	const [meal, setMeal] = useState("");
	const [dietary, setDietary] = useState<string[]>([]);
	const [ingredient, setIngredient] = useState<string[]>([]);
	const [query, setQuery] = useState("");
	const [page, setPage] = useState(1);
	const [debouncedQuery] = useDebouncedValue(query, { wait: 300 });

	const filteredRecipes = useMemo(() => {
		const search = debouncedQuery.trim().toLowerCase();
		return recipes.filter(
			(recipe) =>
				(!meal || recipe.mealTypes.includes(meal)) &&
				(!dietary.length ||
					dietary.some((term) => recipe.dietary.includes(term))) &&
				(!ingredient.length ||
					ingredient.some((term) => recipe.ingredients.includes(term))) &&
				(!search ||
					`${recipe.title} ${recipe.summary ?? ""}`
						.toLowerCase()
						.includes(search)),
		);
	}, [debouncedQuery, dietary, ingredient, meal, recipes]);

	const filteredPdfs = useMemo(() => {
		// PDFs participate in dietary and ingredient filtering, but do not have
		// the meal-type taxonomy used by the recipe collection.
		if (meal) return [];
		const search = debouncedQuery.trim().toLowerCase();
		return pdfs.filter(
			(pdf) =>
				(!dietary.length ||
					dietary.some((term) => pdf.dietary.includes(term))) &&
				(!ingredient.length ||
					ingredient.some((term) => pdf.ingredients.includes(term))) &&
				(!search ||
					`${pdf.title} ${pdf.sourceFilename}`.toLowerCase().includes(search)),
		);
	}, [debouncedQuery, dietary, ingredient, meal, pdfs]);

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

	const clear = () => {
		setMeal("");
		setDietary([]);
		setIngredient([]);
		setQuery("");
	};

	return (
		<div className="grid min-w-0 gap-8 lg:grid-cols-[17rem_minmax(0,1fr)]">
			<aside
				className="recipe-filter-rail min-w-0 self-start lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto"
				aria-label="Filter recipes"
			>
				<Card className="min-w-0 gap-4 rounded-3xl p-5 shadow-lg sm:gap-6">
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
				</Card>
			</aside>
			<div className="min-w-0">
				{visibleItems.length ? (
					<ul className="m-0 grid min-w-0 grid-cols-1 gap-5 p-0 sm:grid-cols-2 xl:grid-cols-3">
						{visibleItems.map((item) =>
							item.type === "recipe" ? (
								<li key={item.entry.slug}>
									<a
										className="block h-full no-underline"
										href={`/recipes/${item.entry.slug}`}
									>
										<Card className="h-full min-w-0 gap-0 overflow-hidden py-0 transition-shadow hover:shadow-md">
											<CardHeader className="gap-0 p-0">
												{item.entry.image ? (
													<img
														className="h-52 w-full object-cover"
														src={imageUrl(item.entry.image)}
														alt={item.entry.image.alt}
														loading="lazy"
														style={{
															viewTransitionName: `recipe-image-${item.entry.slug.replace(/[^a-zA-Z0-9_-]/g, "-")}`,
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
													{item.entry.mealTypeLabels.map((term) => (
														<Badge key={term.slug} variant="secondary">
															{term.label}
														</Badge>
													))}
													{item.entry.dietaryLabels.map((term) => (
														<Badge key={term.slug} variant="outline">
															{term.label}
														</Badge>
													))}
												</div>
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
										<Card className="h-full min-w-0 gap-0 overflow-hidden py-0 transition-shadow hover:shadow-md">
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
					<Pagination className="mt-8" aria-label="Recipe pages">
						<PaginationContent>
							<PaginationItem>
								<PaginationPrevious
									href="#"
									className="aria-disabled:pointer-events-none aria-disabled:opacity-40"
									aria-disabled={currentPage === 1}
									tabIndex={currentPage === 1 ? -1 : undefined}
									onClick={(event) => {
										event.preventDefault();
										if (currentPage > 1) setPage((value) => value - 1);
									}}
								/>
							</PaginationItem>
							{pageItems(currentPage, totalPages).map((item) =>
								typeof item === "number" ? (
									<PaginationItem key={item}>
										<PaginationLink
											href="#"
											isActive={item === currentPage}
											onClick={(event) => {
												event.preventDefault();
												setPage(item);
											}}
										>
											{item}
										</PaginationLink>
									</PaginationItem>
								) : (
									<PaginationItem key={item}>
										<PaginationEllipsis />
									</PaginationItem>
								),
							)}
							<PaginationItem>
								<PaginationNext
									href="#"
									className="aria-disabled:pointer-events-none aria-disabled:opacity-40"
									aria-disabled={currentPage === totalPages}
									tabIndex={currentPage === totalPages ? -1 : undefined}
									onClick={(event) => {
										event.preventDefault();
										if (currentPage < totalPages) setPage((value) => value + 1);
									}}
								/>
							</PaginationItem>
						</PaginationContent>
					</Pagination>
				)}
			</div>
		</div>
	);
}

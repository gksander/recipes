import { CheckIcon, ChevronDownIcon, XIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { Combobox as ComboboxPrimitive } from "@base-ui/react";

import {
	Combobox,
	ComboboxContent,
	ComboboxEmpty,
	ComboboxInput,
	ComboboxItem,
	ComboboxList,
	ComboboxTrigger,
} from "@/components/ui/combobox";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

type Option = { label: string; value: string };
interface Props {
	mealTypes: Option[];
	dietaryOptions: Option[];
	ingredientOptions: Option[];
	initialMealType?: string;
	initialDietary?: string[];
	initialIngredients?: string[];
}

function navigate(meal: string, dietary: string[], ingredient: string[]) {
	const params = new URLSearchParams(window.location.search);
	const set = (name: string, values: string[]) =>
		values.length ? params.set(name, values.join(",")) : params.delete(name);
	meal ? params.set("meal", meal) : params.delete("meal");
	set("dietary", dietary);
	set("ingredient", ingredient);
	params.delete("page");
	window.location.assign(
		`${window.location.pathname}${params.size ? `?${params}` : ""}`,
	);
}

function MultiCombobox({
	label,
	options,
	value,
	onChange,
}: {
	label: string;
	options: Option[];
	value: string[];
	onChange: (value: string[]) => void;
}) {
	const items = useMemo(
		() =>
			ComboboxPrimitive.createItems(options, {
				getValue: (item: Option) => item.value,
				getLabel: (item: Option) => item.label,
			}),
		[options],
	);
	return (
		<Combobox multiple items={items} value={value} onValueChange={onChange}>
			<div className="flex h-11 min-w-40 items-center gap-2 rounded-xl border border-recipe-line bg-white px-3 text-sm">
				<span className="text-[.68rem] font-extrabold tracking-wider text-recipe-muted uppercase">
					{label}
				</span>
				<ComboboxInput
					aria-label={`Filter by ${label.toLowerCase()}`}
					placeholder={value.length ? `${value.length} selected` : "Any"}
				/>
				<ComboboxTrigger
					className="border-0 bg-transparent"
					aria-label={`Open ${label.toLowerCase()} choices`}
				>
					<ChevronDownIcon size={16} />
				</ComboboxTrigger>
			</div>
			<ComboboxContent>
				<ComboboxEmpty>No matches found.</ComboboxEmpty>
				<ComboboxList>
					{(item: Option) => (
						<ComboboxItem key={item.value} value={item.value}>
							<span className="mr-2 opacity-0 data-[selected]:opacity-100">
								<CheckIcon size={14} />
							</span>
							{item.label}
						</ComboboxItem>
					)}
				</ComboboxList>
			</ComboboxContent>
		</Combobox>
	);
}

export default function RecipeFilters({
	mealTypes,
	dietaryOptions,
	ingredientOptions,
	initialMealType = "",
	initialDietary = [],
	initialIngredients = [],
}: Props) {
	const [meal, setMeal] = useState(initialMealType);
	const [dietary, setDietary] = useState(initialDietary);
	const [ingredient, setIngredient] = useState(initialIngredients);
	const clear = () => {
		setMeal("");
		setDietary([]);
		setIngredient([]);
		navigate("", [], []);
	};
	return (
		<section aria-label="Recipe filters">
			<div className="flex flex-wrap items-center gap-3 rounded-2xl border border-recipe-line bg-white p-4">
				<Select
					items={[{ label: "Any meal type", value: "" }, ...mealTypes]}
					value={meal || null}
					onValueChange={(value) => setMeal(value ?? "")}
				>
					<SelectTrigger
						className="h-11 min-w-40 border-recipe-line bg-white"
						aria-label="Meal type"
					>
						<span className="text-[.68rem] font-extrabold tracking-wider text-recipe-muted uppercase">
							Meal type
						</span>
						<SelectValue placeholder="Any" />
					</SelectTrigger>
					<SelectContent>
						<SelectGroup>
							{[{ label: "Any meal type", value: "" }, ...mealTypes].map(
								(item) => (
									<SelectItem key={item.value || "any"} value={item.value}>
										{item.label}
									</SelectItem>
								),
							)}
						</SelectGroup>
					</SelectContent>
				</Select>
				<MultiCombobox
					label="Dietary"
					options={dietaryOptions}
					value={dietary}
					onChange={setDietary}
				/>
				<MultiCombobox
					label="Ingredient"
					options={ingredientOptions}
					value={ingredient}
					onChange={setIngredient}
				/>
				<button
					className="rounded-xl bg-recipe-ink px-4 py-3 text-sm font-extrabold text-white"
					type="button"
					onClick={() => navigate(meal, dietary, ingredient)}
				>
					Apply filters
				</button>
				{Boolean(meal || dietary.length || ingredient.length) && (
					<button
						className="flex items-center gap-1 bg-transparent text-sm text-recipe-muted"
						type="button"
						onClick={clear}
					>
						<XIcon size={15} /> Reset
					</button>
				)}
			</div>
		</section>
	);
}

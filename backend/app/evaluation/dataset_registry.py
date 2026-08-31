"""
Centralized Dataset Definition and Semantic Group Registry.

Provides dataset class schemas, names, counts, and versioned semantic group hierarchies
for benchmark evaluation and confusion matrix analytics.
"""

from typing import List, Dict, Any, Optional
from dataclasses import dataclass, field


@dataclass
class DatasetDefinition:
    name: str
    num_classes: int
    class_names: List[str]
    semantic_groups: Dict[str, List[str]] = field(default_factory=dict)
    default_test_samples: int = 10000
    description: str = ""

    def get_class_name(self, index: int) -> str:
        if 0 <= index < len(self.class_names):
            return self.class_names[index]
        return f"Class_{index}"

    def get_class_index(self, name: str) -> Optional[int]:
        name_lower = name.lower()
        for idx, c in enumerate(self.class_names):
            if c.lower() == name_lower:
                return idx
        return None

    def get_semantic_group(self, class_name: str) -> Optional[str]:
        for group_name, members in self.semantic_groups.items():
            if class_name in members or class_name.lower() in [m.lower() for m in members]:
                return group_name
        return None


# ── Built-in Dataset Catalog ──────────────────────────────────────────────────

DATASET_CATALOG: Dict[str, DatasetDefinition] = {
    "CIFAR-10": DatasetDefinition(
        name="CIFAR-10",
        num_classes=10,
        class_names=[
            "airplane", "automobile", "bird", "cat", "deer",
            "dog", "frog", "horse", "ship", "truck"
        ],
        semantic_groups={
            "Vehicles": ["airplane", "automobile", "ship", "truck"],
            "Animals": ["bird", "cat", "deer", "dog", "frog", "horse"],
        },
        default_test_samples=10000,
        description="Standard 10-class dataset of 32x32 color images.",
    ),
    "CIFAR-100": DatasetDefinition(
        name="CIFAR-100",
        num_classes=100,
        class_names=[
            # 100 fine-grained classes
            "apple", "aquarium_fish", "baby", "bear", "beaver", "bed", "bee", "beetle", "bicycle", "bottle",
            "bowl", "boy", "bridge", "bus", "butterfly", "camel", "can", "castle", "caterpillar", "cattle",
            "chair", "chimpanzee", "clock", "cloud", "cockroach", "couch", "crab", "crocodile", "cup", "dinosaur",
            "dolphin", "elephant", "flatfish", "forest", "fox", "girl", "hamster", "house", "kangaroo", "keyboard",
            "lamp", "lawn_mower", "leopard", "lion", "lizard", "lobster", "man", "maple_tree", "motorcycle", "mountain",
            "mouse", "mushroom", "oak_tree", "orange", "orchid", "otter", "palm_tree", "pear", "pickup_truck", "pine_tree",
            "plain", "plate", "poppy", "porcupine", "possum", "rabbit", "raccoon", "ray", "road", "rocket",
            "rose", "sea", "seal", "shark", "shrew", "skunk", "skyscraper", "snail", "snake", "spider",
            "squirrel", "streetcar", "sunflower", "sweet_pepper", "table", "tank", "telephone", "television", "tiger", "tractor",
            "train", "trout", "tulip", "turtle", "wardrobe", "whale", "willow_tree", "wolf", "woman", "worm"
        ],
        semantic_groups={
            "Aquatic Mammals": ["beaver", "dolphin", "otter", "seal", "whale"],
            "Fish": ["aquarium_fish", "flatfish", "ray", "shark", "trout"],
            "Flowers": ["orchid", "poppy", "rose", "sunflower", "tulip"],
            "Food Containers": ["bottle", "bowl", "can", "cup", "plate"],
            "Fruit and Vegetables": ["apple", "mushroom", "orange", "pear", "sweet_pepper"],
            "Household Electrical": ["clock", "keyboard", "lamp", "telephone", "television"],
            "Household Furniture": ["bed", "chair", "couch", "table", "wardrobe"],
            "Insects": ["bee", "beetle", "butterfly", "caterpillar", "cockroach"],
            "Large Carnivores": ["bear", "leopard", "lion", "tiger", "wolf"],
            "Large Man-Made Outdoor": ["bridge", "castle", "house", "road", "skyscraper"],
            "Large Natural Outdoor": ["cloud", "forest", "mountain", "plain", "sea"],
            "Large Omnivores and Herbivores": ["camel", "cattle", "chimpanzee", "elephant", "kangaroo"],
            "Medium Mammals": ["fox", "porcupine", "possum", "raccoon", "skunk"],
            "Non-Insect Invertebrates": ["crab", "lobster", "snail", "spider", "worm"],
            "People": ["baby", "boy", "girl", "man", "woman"],
            "Reptiles": ["crocodile", "dinosaur", "lizard", "snake", "turtle"],
            "Small Mammals": ["hamster", "mouse", "rabbit", "shrew", "squirrel"],
            "Trees": ["maple_tree", "oak_tree", "palm_tree", "pine_tree", "willow_tree"],
            "Vehicles 1": ["bicycle", "bus", "motorcycle", "pickup_truck", "train"],
            "Vehicles 2": ["lawn_mower", "rocket", "streetcar", "tank", "tractor"],
        },
        default_test_samples=10000,
        description="100 fine-grained classes grouped into 20 superclasses.",
    ),
    "MNIST": DatasetDefinition(
        name="MNIST",
        num_classes=10,
        class_names=["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"],
        semantic_groups={
            "Even Digits": ["0", "2", "4", "6", "8"],
            "Odd Digits": ["1", "3", "5", "7", "9"],
        },
        default_test_samples=10000,
        description="28x28 grayscale handwritten digits 0-9.",
    ),
    "FASHION-MNIST": DatasetDefinition(
        name="Fashion-MNIST",
        num_classes=10,
        class_names=[
            "T-shirt/top", "Trouser", "Pullover", "Dress", "Coat",
            "Sandal", "Shirt", "Sneaker", "Bag", "Ankle boot"
        ],
        semantic_groups={
            "Apparel": ["T-shirt/top", "Trouser", "Pullover", "Dress", "Coat", "Shirt"],
            "Footwear": ["Sandal", "Sneaker", "Ankle boot"],
            "Accessories": ["Bag"],
        },
        default_test_samples=10000,
        description="Zalando fashion product grayscale images in 10 classes.",
    ),
    "EUROSAT": DatasetDefinition(
        name="EuroSAT",
        num_classes=10,
        class_names=[
            "AnnualCrop", "Forest", "HerbaceousVegetation", "Highway", "Industrial",
            "Pasture", "PermanentCrop", "Residential", "River", "SeaLake"
        ],
        semantic_groups={
            "Natural Vegetation": ["AnnualCrop", "Forest", "HerbaceousVegetation", "Pasture", "PermanentCrop"],
            "Human Infrastructure": ["Highway", "Industrial", "Residential"],
            "Water Bodies": ["River", "SeaLake"],
        },
        default_test_samples=5400,
        description="Sentinel-2 satellite land cover classification across 10 distinct terrain classes.",
    ),
    "BLOODMNIST": DatasetDefinition(
        name="BloodMNIST",
        num_classes=8,
        class_names=[
            "basophil", "eosinophil", "erythroblast", "immature granulocyte",
            "lymphocyte", "monocyte", "neutrophil", "platelet"
        ],
        semantic_groups={
            "Granulocytes": ["basophil", "eosinophil", "neutrophil", "immature granulocyte"],
            "Agranulocytes": ["lymphocyte", "monocyte"],
            "Precursors & Fragments": ["erythroblast", "platelet"],
        },
        default_test_samples=3421,
        description="Biomedical microscopic images of 8 peripheral blood cell morphology types.",
    ),
    "SVHN": DatasetDefinition(
        name="SVHN",
        num_classes=10,
        class_names=["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"],
        semantic_groups={
            "Low Digits": ["0", "1", "2", "3", "4"],
            "High Digits": ["5", "6", "7", "8", "9"],
        },
        default_test_samples=26032,
        description="Street View House Numbers 32x32 color digits cropped from real-world photos.",
    ),
    "STL-10": DatasetDefinition(
        name="STL-10",
        num_classes=10,
        class_names=[
            "airplane", "bird", "car", "cat", "deer",
            "dog", "horse", "monkey", "ship", "truck"
        ],
        semantic_groups={
            "Vehicles": ["airplane", "car", "ship", "truck"],
            "Animals": ["bird", "cat", "deer", "dog", "horse", "monkey"],
        },
        default_test_samples=8000,
        description="96x96 resolution vision benchmark dataset inspired by CIFAR-10 with higher detail.",
    ),
    "IMAGENET-1K": DatasetDefinition(
        name="ImageNet-1k Subset",
        num_classes=100,
        class_names=[f"ImageNet_Class_{i}" for i in range(100)],
        semantic_groups={
            "Fauna": [f"ImageNet_Class_{i}" for i in range(0, 40)],
            "Artifacts & Vehicles": [f"ImageNet_Class_{i}" for i in range(40, 80)],
            "Flora & Natural": [f"ImageNet_Class_{i}" for i in range(80, 100)],
        },
        default_test_samples=5000,
        description="Representative 100-class subset of ImageNet-1k.",
    ),
}


def normalize_dataset_key(name: str) -> str:
    """Normalize dataset name for catalog key lookup."""
    clean = (name or "").strip().upper().replace("_", "-")
    if "EUROSAT" in clean:
        return "EUROSAT"
    if "BLOOD" in clean:
        return "BLOODMNIST"
    if "SVHN" in clean:
        return "SVHN"
    if "STL" in clean:
        return "STL-10"
    if "CIFAR-100" in clean:
        return "CIFAR-100"
    if "CIFAR-10" in clean or "CIFAR10" in clean:
        return "CIFAR-10"
    if "FASHION" in clean:
        return "FASHION-MNIST"
    if "MNIST" in clean:
        return "MNIST"
    if "IMAGENET" in clean:
        return "IMAGENET-1K"
    return clean


def get_dataset_definition(dataset_name: str, num_classes: Optional[int] = None, custom_classes: Optional[List[str]] = None) -> DatasetDefinition:
    """
    Retrieve dataset definition by name or build a dynamic definition for custom datasets.
    """
    key = normalize_dataset_key(dataset_name)
    if key in DATASET_CATALOG:
        return DATASET_CATALOG[key]

    # Custom or uncatalogued dataset
    if custom_classes and len(custom_classes) > 0:
        return DatasetDefinition(
            name=dataset_name,
            num_classes=len(custom_classes),
            class_names=custom_classes,
            semantic_groups={},
            default_test_samples=1000,
            description=f"Custom dataset: {dataset_name}",
        )

    k = num_classes if (num_classes and num_classes > 0) else 10
    return DatasetDefinition(
        name=dataset_name or "Custom-Dataset",
        num_classes=k,
        class_names=[f"Class_{i}" for i in range(k)],
        semantic_groups={},
        default_test_samples=1000,
        description=f"Custom dataset: {dataset_name}",
    )

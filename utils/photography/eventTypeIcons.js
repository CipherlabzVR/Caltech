import CategoryIcon from "@mui/icons-material/Category";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import FavoriteIcon from "@mui/icons-material/Favorite";
import HomeIcon from "@mui/icons-material/Home";
import CakeIcon from "@mui/icons-material/Cake";
import PregnantWomanIcon from "@mui/icons-material/PregnantWoman";
import EventIcon from "@mui/icons-material/Event";

export const DEFAULT_ICON_KEY = "Event";

export const ICON_OPTIONS = [
  { key: "Event", label: "Default", Icon: EventIcon },
  { key: "PhotoCamera", label: "Preshoot", Icon: PhotoCameraIcon },
  { key: "FavoriteBorder", label: "Engagement", Icon: FavoriteBorderIcon },
  { key: "Favorite", label: "Wedding", Icon: FavoriteIcon },
  { key: "Home", label: "Homecoming", Icon: HomeIcon },
  { key: "Cake", label: "Birthday", Icon: CakeIcon },
  { key: "PregnantWoman", label: "Maternity Shoot", Icon: PregnantWomanIcon },
  { key: "Category", label: "General", Icon: CategoryIcon },
];

const iconMap = ICON_OPTIONS.reduce((map, option) => {
  map[option.key] = option.Icon;
  return map;
}, {});

export const resolveEventTypeIcon = (iconName) =>
  iconMap[iconName] || iconMap[DEFAULT_ICON_KEY];

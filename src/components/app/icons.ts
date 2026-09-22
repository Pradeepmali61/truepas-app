/**
 * App icon registry — maps the legacy `IconName` string vocabulary to
 * lucide-react-native components. Consumers use `<AppIcon name="search" />`
 * (or the re-exported `Icon` with `name` prop) for backward compatibility
 * while new code uses the ui-native children-based `<Icon><Search /></Icon>`.
 */
import {
    ArrowLeft,
    Bell,
    Cake,
    Calendar,
    Camera,
    Check,
    CheckCircle2,
    ChevronDown,
    ChevronRight,
    Clock,
    Download,
    Edit3,
    Eye,
    EyeOff,
    FileText,
    History,
    Hotel,
    IdCard,
    Info,
    LogOut,
    type LucideIcon,
    Mail,
    MapPin,
    Menu,
    MoreHorizontal,
    Phone,
    Plus,
    QrCode,
    ScanFace,
    Search,
    Settings,
    Shield,
    ShieldCheck,
    Smartphone,
    Sparkles,
    Stamp,
    Trash2,
    TriangleAlert,
    User,
    UserPlus,
    Users,
    X
} from "lucide-react-native";
import { SteeringWheelIcon } from "./SteeringWheelIcon";

export type IconName =
  | "identity"
  | "documents"
  | "family"
  | "history"
  | "back"
  | "bell"
  | "settings"
  | "camera"
  | "face"
  | "shield"
  | "lock"
  | "check"
  | "checkCircle"
  | "cross"
  | "warning"
  | "info"
  | "calendar"
  | "cake"
  | "trash"
  | "clock"
  | "search"
  | "plus"
  | "chevron"
  | "chevronDown"
  | "document"
  | "passport"
  | "drivingLicense"
  | "idCard"
  | "greenCard"
  | "birthCertificate"
  | "usVisa"
  | "selfie"
  | "smartphone"
  | "phone"
  | "email"
  | "eye"
  | "eyeClosed"
  | "edit"
  | "logout"
  | "hotel"
  | "invoice"
  | "qr"
  | "sparkle"
  | "hourglass"
  | "location"
  | "otpcode"
  | "inbox"
  | "menu"
  | "more"
  | "scanFace"
  | "download"
  | "user"
  | "userPlus";

const REGISTRY: Record<IconName, LucideIcon> = {
  identity: IdCard,
  documents: FileText,
  family: Users,
  history: History,
  back: ArrowLeft,
  bell: Bell,
  settings: Settings,
  camera: Camera,
  face: ScanFace,
  shield: ShieldCheck,
  lock: Shield,
  check: Check,
  checkCircle: CheckCircle2,
  cross: X,
  warning: TriangleAlert,
  info: Info,
  calendar: Calendar,
  cake: Cake,
  trash: Trash2,
  clock: Clock,
  search: Search,
  plus: Plus,
  chevron: ChevronRight,
  chevronDown: ChevronDown,
  document: FileText,
  passport: Stamp,
  drivingLicense: SteeringWheelIcon,
  idCard: IdCard,
  greenCard: IdCard,
  birthCertificate: FileText,
  usVisa: Stamp,
  selfie: User,
  smartphone: Smartphone,
  phone: Phone,
  email: Mail,
  eye: Eye,
  eyeClosed: EyeOff,
  edit: Edit3,
  logout: LogOut,
  hotel: Hotel,
  invoice: FileText,
  qr: QrCode,
  sparkle: Sparkles,
  hourglass: Clock,
  location: MapPin,
  otpcode: Smartphone,
  inbox: Bell,
  menu: Menu,
  more: MoreHorizontal,
  scanFace: ScanFace,
  download: Download,
  user: User,
  userPlus: UserPlus,
};

export function getIcon(name: IconName): LucideIcon {
  return REGISTRY[name] ?? Info;
}

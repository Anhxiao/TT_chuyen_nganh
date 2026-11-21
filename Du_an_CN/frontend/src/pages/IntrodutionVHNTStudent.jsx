import OrganizationIntroductionStudent from "../components/OrganizationIntroductionStudent.jsx";
import "../styles/styles-organization-introduction-student.css";

function IntrodutionVHNTStudent() {
    const organization = {
        name: "CLB Văn hóa Nghệ thuật TVU",
        description: "Thông tin giới thiệu về CLB Văn hóa Nghệ thuật TVU.",
        address: "",
        email: "",
        phone: "",

        members: [
            { name: "", position: "Chủ nhiệm", phone: "" },
            { name: "", position: "Phó Chủ nhiệm", phone: "" },
            { name: "", position: "Phó Chủ nhiệm", phone: "" },
            { name: "", position: "Ủy viên", phone: "" },
            { name: "", position: "Ủy viên", phone: "" },
            { name: "", position: "Ủy viên", phone: "" },
            { name: "", position: "Ủy viên", phone: "" }
        ]
    };

    return <OrganizationIntroductionStudent organization={organization} />;
}

export default IntrodutionVHNTStudent;
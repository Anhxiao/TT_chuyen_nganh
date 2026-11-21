import OrganizationIntroductionStudent from "../components/OrganizationIntroductionStudent.jsx";
import "../styles/styles-organization-introduction-student.css";

function IntrodutionKNSStudent() {
    const organization = {
        name: "CLB Kỹ năng sống",
        description: "Thông tin giới thiệu về CLB Kỹ năng sống.",
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

export default IntrodutionKNSStudent;
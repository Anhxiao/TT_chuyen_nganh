import OrganizationIntroductionStudent from "../components/OrganizationIntroductionStudent.jsx";
import "../styles/styles-organization-introduction-student.css";

function IntroductionCNTTStudent() {
    const organization = {
        name: "Đoàn trường Kỹ thuật và Công nghệ",
        description: "Thông tin giới thiệu về Đoàn trường Kỹ thuật và Công nghệ.",
        address: "",
        email: "",
        phone: "",

        members: [
            { name: "", position: "Bí thư", phone: "" },
            { name: "", position: "Phó Bí thư", phone: "" },
            { name: "", position: "Phó Bí thư", phone: "" },
            { name: "", position: "Ủy viên", phone: "" },
            { name: "", position: "Ủy viên", phone: "" },
            { name: "", position: "Ủy viên", phone: "" },
            { name: "", position: "Ủy viên", phone: "" }
        ]
    };

    return <OrganizationIntroductionStudent organization={organization} />;
}

export default IntroductionCNTTStudent;
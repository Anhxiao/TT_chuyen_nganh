import OrganizationIntroductionStudent from "../components/OrganizationIntroductionStudent.jsx";
import "../styles/styles-organization-introduction-student.css";

function IntroductionYDStudent() {
    const organization = {
        name: "Đoàn trường Y dược",
        description: "Thông tin giới thiệu về Đoàn trường Y dược.",
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

export default IntroductionYDStudent;
import OrganizationIntroductionStudent from "../components/OrganizationIntroductionStudent.jsx";
import "../styles/styles-organization-introduction-student.css";

function IntroductionKTStudent() {
    const organization = {
        name: "Đoàn trường Kinh tế Luật",
        description: "Thông tin giới thiệu về Đoàn trường Kinh tế Luật.",
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

export default IntroductionKTStudent;
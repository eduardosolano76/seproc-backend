package com.example.demo.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import com.example.demo.modelo.SolicitudInstitucion;
import com.example.demo.repository.SolicitudInstitucionRepository;

import jakarta.servlet.http.HttpServletRequest;

@Controller
public class SeprocController {
	
	@Autowired
    private SolicitudInstitucionRepository solicitudRepository;

	@GetMapping("/seproc")
	public String seproc(Model model, HttpServletRequest request) {
		request.getSession(true);
		
		model.addAttribute("solicitud", new SolicitudInstitucion());
		return "seprocIndex/seproc";
	}  
	
	// Muestra la pantalla del formulario
	@GetMapping("/solicitar-acceso")
    public String mostrarFormularioSolicitud(Model model) {
        // Le pasamos un objeto vacío a Thymeleaf para que lo llene con el formulario
        model.addAttribute("solicitud", new SolicitudInstitucion());
        
        return "seprocIndex/solicitar-acceso"; 
    }
	
	// Recibe los datos cuando el usuario da clic en "Enviar"
    @PostMapping("/solicitar-acceso")
    public String guardarSolicitud(@ModelAttribute("solicitud") SolicitudInstitucion solicitud, 
                                   RedirectAttributes redirectAttributes) {
        
        // Guardamos la solicitud en la base de datos.
        // Nota: El estado 'PENDIENTE' y la fecha se asignan automáticamente 
        solicitudRepository.save(solicitud);
        
        // Agregamos un mensaje de éxito temporal (Flash Attribute)
        redirectAttributes.addFlashAttribute("mensajeExito", 
            "¡Tu solicitud ha sido enviada correctamente! El equipo de SeProc se pondrá en contacto pronto.");
        
        // Redirigimos a la página principal. Usar "redirect" evita que el 
        // formulario se reenvíe por accidente si el usuario recarga la página.
        return "redirect:/seproc"; 
    }
}
